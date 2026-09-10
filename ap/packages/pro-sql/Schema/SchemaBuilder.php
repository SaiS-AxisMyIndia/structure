<?php

declare(strict_types=1);

namespace ProSql\Schema;

use ProSql\Attributes\Migration;
use ProSql\Connection;
use Throwable;

/**
 * Ties EntityScanner + SchemaInspector + SchemaDiffer + DdlGenerator +
 * MigrationWriter together into what `gg build` actually runs (via
 * ProSqlModule::build() — see its docblock for why this package's own
 * Connection/Schema classes are only ever reached through that hook,
 * never referenced directly from gerogo's BuildCommand).
 *
 * What each TABLE_WRITE mode is allowed to touch:
 *
 *   - update: safe/additive changes only — CREATE TABLE for a new
 *     entity, ADD COLUMN for a column missing from an existing table,
 *     ADD a foreign key (only when the referenced table already
 *     exists, or was itself just created earlier in this same run —
 *     see dependencyOrder()). A column that already exists but with a
 *     different type/nullability is NOT touched — that's "complex",
 *     deferred to the script either way.
 *   - migrate (default): nothing. Every statement this run would have
 *     run is written into the migration script as "COMPLEX — NOT
 *     applied", for review.
 *   - force: everything update does, PLUS MODIFY COLUMN for those
 *     complex type/nullability changes.
 *
 * One thing NO mode ever does: drop a column, or a table. A column
 * present in the database but not declared on the entity
 * (TableDiff::$extraColumns) is purely informational — dropping data a
 * human didn't explicitly ask to drop isn't something "force" should
 * mean. If you actually want a column gone, that's a deliberate manual
 * migration, not an automatic one.
 *
 * A #[Migration]-declared raw SQL block (see that attribute's own
 * docblock) rides along with whichever of the above actually touches
 * its entity: it's skipped entirely under 'migrate' (deferred into the
 * migration script instead, same as everything else) and run verbatim
 * under 'update'/'force' — but ONLY on a build where that entity has
 * some other diff to apply in the first place (see the `if
 * ($diff->isEmpty())` check in build()); a build with nothing new to
 * say about that entity never touches it. Not idempotency, just a
 * smaller window for it to matter.
 *
 * Entities are processed in dependency order (see dependencyOrder()),
 * not in whatever order runner/entities.php happens to list them —
 * every #[Link]'d entity is visited before whatever links to it. That's
 * what lets a foreign key into a table that's ALSO brand new this same
 * run get inlined straight into CREATE TABLE, instead of always being
 * deferred the way it used to be regardless of order: under
 * 'update'/'force' the referenced table is genuinely already in the
 * database by the time its dependent is created (same connection, same
 * run, earlier in the now-correct order); under 'migrate' nothing is
 * ever really applied, so $tablesQueuedThisRun tracks "already written
 * earlier in this run's migration script" instead — either way, the
 * script this run ultimately produces is one that CAN be run top to
 * bottom without hitting a missing-table error partway through.
 *
 * The one thing that ordering can't fix: two entities linking to EACH
 * OTHER (an actual cycle). There's no valid dependency order for that,
 * so dependencyOrder() just leaves both wherever DFS already had them —
 * one (or both) of their #[Link] columns still gets deferred, same as
 * before. Also still v1-scoped: no retrofitting a FK onto a column that
 * already existed before #[Link] was added to it — a real gap, left for
 * later rather than half-implemented.
 */
final class SchemaBuilder
{
    private readonly SchemaInspector $inspector;
    private readonly SchemaDiffer $differ;
    private readonly DdlGenerator $generator;
    private readonly MigrationWriter $writer;

    /**
     * Tables this run has already decided to create, in processing
     * order — reset at the top of build(). See dependencyOrder() and
     * this class's own docblock for why applyNewTable() consults this
     * (not just SchemaInspector::tableExists()) when deciding whether a
     * #[Link] can be inlined into CREATE TABLE.
     *
     * @var list<string>
     */
    private array $tablesQueuedThisRun = [];

    /**
     * @param 'update'|'migrate'|'force' $tableWrite
     * @param SchemaInspector|null $inspector override for tests only (a real MySQL-backed one otherwise) — same for $differ
     */
    public function __construct(
        private readonly Connection $connection,
        private readonly string $tableWrite,
        string $migrationsPath,
        ?SchemaInspector $inspector = null,
        ?SchemaDiffer $differ = null,
    ) {
        $this->inspector = $inspector ?? new SchemaInspector($connection);
        $this->differ = $differ ?? new SchemaDiffer($this->inspector);
        $this->generator = new DdlGenerator();
        $this->writer = new MigrationWriter($migrationsPath);
    }

    /** @param list<class-string> $entityClasses */
    public function build(array $entityClasses): BuildReport
    {
        $tablesCreated = 0;
        $columnsAdded = 0;
        $foreignKeysAdded = 0;
        $indexesAdded = 0;
        $complexDeferred = 0;
        $rawStatementsRun = 0;
        $errors = [];
        $entries = [];
        $this->tablesQueuedThisRun = [];

        foreach ($this->dependencyOrder($entityClasses) as $entityClass) {
            try {
                $entity = EntityScanner::scan($entityClass, $entityClasses);
                $diff = $this->differ->diff($entity);

                if ($diff->isEmpty()) {
                    continue;
                }

                $result = $diff->isNewTable ? $this->applyNewTable($entity) : $this->applyExisting($entity, $diff);
                $migrationResult = $this->applyRawMigration($entityClass);

                $tablesCreated += $result['tablesCreated'];
                $columnsAdded += $result['columnsAdded'];
                $foreignKeysAdded += $result['foreignKeysAdded'];
                $indexesAdded += $result['indexesAdded'];
                $complexDeferred += $result['complexDeferred'];
                $rawStatementsRun += $migrationResult['statementsRun'];

                $entries[] = [
                    'table' => $entity->table,
                    'applied' => [...$result['applied'], ...$migrationResult['applied']],
                    'deferred' => [...$result['deferred'], ...$migrationResult['deferred']],
                ];
            } catch (Throwable $e) {
                // One bad entity doesn't stop the rest — same "report,
                // don't abort" spirit as BuildCommand's own route-build
                // step, just scoped per-entity instead of per-command.
                $errors[] = "$entityClass: {$e->getMessage()}";
            }
        }

        $migrationFile = $this->writer->write($entries);

        return new BuildReport($tablesCreated, $columnsAdded, $foreignKeysAdded, $indexesAdded, $complexDeferred, $rawStatementsRun, $migrationFile, $errors);
    }

    /**
     * Orders $entityClasses so every #[Link]'d entity is visited before
     * whatever links to it — a postorder depth-first topological sort
     * over the dependency graph #[Link] columns describe (an entity
     * class's own $entityClasses index doesn't matter; only its
     * #[Link]s' target TABLES do). See this class's own docblock for
     * why that ordering is what lets a same-run FK actually get inlined
     * instead of always deferred.
     *
     * A class that fails to scan is left out of the graph entirely
     * (build()'s own per-entity try/catch is what actually reports that
     * failure) — it just falls back to its original relative position,
     * same as anything caught in a dependency CYCLE (two entities
     * linking to each other have no valid order between them; DFS
     * detects the cycle via $visiting and simply stops recursing rather
     * than looping forever, leaving both wherever the traversal already
     * reached them).
     *
     * @param list<class-string> $entityClasses
     * @return list<class-string>
     */
    private function dependencyOrder(array $entityClasses): array
    {
        $tableForClass = [];
        $classForTable = [];
        $dependsOnTables = [];

        foreach ($entityClasses as $entityClass) {
            try {
                $entity = EntityScanner::scan($entityClass, $entityClasses);
            } catch (Throwable) {
                continue;
            }

            $tableForClass[$entityClass] = $entity->table;
            $classForTable[$entity->table] = $entityClass;
            $dependsOnTables[$entity->table] = array_values(array_unique(array_filter(array_map(
                static fn (ColumnDefinition $column): ?string => $column->references['table'] ?? null,
                $entity->columns,
            ))));
        }

        $ordered = [];
        $visited = [];
        $visiting = [];

        $visit = function (string $entityClass) use (&$visit, &$ordered, &$visited, &$visiting, $tableForClass, $classForTable, $dependsOnTables): void {
            if (isset($visited[$entityClass]) || isset($visiting[$entityClass])) {
                return;
            }

            $visiting[$entityClass] = true;
            $table = $tableForClass[$entityClass] ?? null;

            foreach (($table !== null ? $dependsOnTables[$table] : []) as $dependencyTable) {
                $dependencyClass = $classForTable[$dependencyTable] ?? null;

                if ($dependencyClass !== null) {
                    $visit($dependencyClass);
                }
            }

            unset($visiting[$entityClass]);
            $visited[$entityClass] = true;
            $ordered[] = $entityClass;
        };

        foreach ($entityClasses as $entityClass) {
            $visit($entityClass);
        }

        return $ordered;
    }

    /**
     * Runs (or, under TABLE_WRITE=migrate, defers) whatever #[Migration]
     * declares on $entityClass — see that attribute's own docblock. A
     * no-op when the entity declares none, which is the common case.
     *
     * @return array{applied: list<string>, deferred: list<array{sql: string, reason: string}>, statementsRun: int}
     */
    private function applyRawMigration(string $entityClass): array
    {
        $migration = Migration::of($entityClass);

        if ($migration === null) {
            return ['applied' => [], 'deferred' => [], 'statementsRun' => 0];
        }

        $applied = [];
        $deferred = [];
        $statementsRun = 0;

        foreach ($migration->statements() as $sql) {
            if ($this->tableWrite === 'migrate') {
                $deferred[] = ['sql' => $sql, 'reason' => 'TABLE_WRITE=migrate — nothing is applied automatically'];

                continue;
            }

            $this->connection->statement($sql);
            $applied[] = $sql;
            $statementsRun++;
        }

        return ['applied' => $applied, 'deferred' => $deferred, 'statementsRun' => $statementsRun];
    }

    /** @return array{tablesCreated: int, columnsAdded: int, foreignKeysAdded: int, indexesAdded: int, complexDeferred: int, applied: list<string>, deferred: list<array{sql: string, reason: string}>} */
    private function applyNewTable(EntityDefinition $entity): array
    {
        $applied = [];
        $deferred = [];
        $tablesCreated = 0;
        $foreignKeysAdded = 0;

        // Inline the FKs whose referenced table is already there for
        // real, OR was itself already queued for creation earlier THIS
        // run (dependencyOrder() guarantees that means "earlier", never
        // "later") — see this class's own docblock.
        $creatableFkColumns = [];

        foreach ($entity->columns as $column) {
            if ($column->references === null) {
                continue;
            }

            $referencedTable = $column->references['table'];

            if ($this->inspector->tableExists($referencedTable) || in_array($referencedTable, $this->tablesQueuedThisRun, true)) {
                $creatableFkColumns[] = $column->name;
            } else {
                $deferred[] = [
                    'sql' => $this->generator->addForeignKey($entity->table, $column),
                    'reason' => "referenced table `{$referencedTable}` doesn't exist yet",
                ];
            }
        }

        $this->tablesQueuedThisRun[] = $entity->table;

        $createSql = $this->generator->createTable($entity, $creatableFkColumns);

        if ($this->tableWrite === 'migrate') {
            $deferred[] = ['sql' => $createSql, 'reason' => 'TABLE_WRITE=migrate — nothing is applied automatically'];
        } else {
            $this->connection->statement($createSql);
            $applied[] = $createSql;
            $tablesCreated++;
            $foreignKeysAdded += count($creatableFkColumns);
        }

        return [
            'tablesCreated' => $tablesCreated,
            'columnsAdded' => 0,
            'foreignKeysAdded' => $foreignKeysAdded,
            // Never here — a plain index is inlined straight into
            // CREATE TABLE itself (see createTable()), so it never shows
            // up as a separately-applied statement the way a retrofitted
            // one onto an EXISTING table does in applyExisting() below.
            'indexesAdded' => 0,
            'complexDeferred' => 0,
            'applied' => $applied,
            'deferred' => $deferred,
        ];
    }

    /** @return array{tablesCreated: int, columnsAdded: int, foreignKeysAdded: int, indexesAdded: int, complexDeferred: int, applied: list<string>, deferred: list<array{sql: string, reason: string}>} */
    private function applyExisting(EntityDefinition $entity, TableDiff $diff): array
    {
        $applied = [];
        $deferred = [];
        $columnsAdded = 0;
        $foreignKeysAdded = 0;
        $indexesAdded = 0;
        $complexDeferred = 0;

        foreach ($diff->missingColumns as $column) {
            $sql = $this->generator->addColumn($entity->table, $column);

            if ($this->tableWrite === 'migrate') {
                $deferred[] = ['sql' => $sql, 'reason' => 'TABLE_WRITE=migrate — nothing is applied automatically'];
            } else {
                $this->connection->statement($sql);
                $applied[] = $sql;
                $columnsAdded++;
            }

            if ($column->references !== null) {
                $fkSql = $this->generator->addForeignKey($entity->table, $column);
                $referencedTable = $column->references['table'];
                $referencedAvailable = $this->inspector->tableExists($referencedTable) || in_array($referencedTable, $this->tablesQueuedThisRun, true);

                if ($this->tableWrite !== 'migrate' && $referencedAvailable) {
                    $this->connection->statement($fkSql);
                    $applied[] = $fkSql;
                    $foreignKeysAdded++;
                } else {
                    $deferred[] = [
                        'sql' => $fkSql,
                        'reason' => match (true) {
                            $this->tableWrite === 'migrate' => 'TABLE_WRITE=migrate — nothing is applied automatically',
                            default => "referenced table `{$referencedTable}` doesn't exist yet",
                        },
                    ];
                }
            }

            // A plain #[Enum(index: true)] index — retrofitted onto an
            // EXISTING table's brand-new column, so (unlike createTable())
            // it needs its own ALTER rather than being inlined for free.
            if ($column->index) {
                $indexSql = $this->generator->addIndex($entity->table, $column->name);

                if ($this->tableWrite === 'migrate') {
                    $deferred[] = ['sql' => $indexSql, 'reason' => 'TABLE_WRITE=migrate — nothing is applied automatically'];
                } else {
                    $this->connection->statement($indexSql);
                    $applied[] = $indexSql;
                    $indexesAdded++;
                }
            }
        }

        foreach ($diff->changedColumns as $column) {
            $sql = $this->generator->modifyColumn($entity->table, $column);

            if ($this->tableWrite === 'force') {
                $this->connection->statement($sql);
                $applied[] = $sql;
            } else {
                $deferred[] = [
                    'sql' => $sql,
                    'reason' => $this->tableWrite === 'migrate'
                        ? 'TABLE_WRITE=migrate — nothing is applied automatically'
                        : 'a column type/nullability change — needs TABLE_WRITE=force, review first',
                ];
                $complexDeferred++;
            }
        }

        return [
            'tablesCreated' => 0,
            'columnsAdded' => $columnsAdded,
            'foreignKeysAdded' => $foreignKeysAdded,
            'indexesAdded' => $indexesAdded,
            'complexDeferred' => $complexDeferred,
            'applied' => $applied,
            'deferred' => $deferred,
        ];
    }
}
