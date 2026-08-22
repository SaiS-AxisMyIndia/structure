<?php

declare(strict_types=1);

namespace ProSql\Schema;

use ProSql\Connection;
use Throwable;

/**
 * Ties EntityScanner + SchemaInspector + SchemaDiffer + DdlGenerator +
 * MigrationWriter together into what `apc build` actually runs (via
 * ProSqlModule::build() — see its docblock for why this package's own
 * Connection/Schema classes are only ever reached through that hook,
 * never referenced directly from api-pro's BuildCommand).
 *
 * What each TABLE_WRITE mode is allowed to touch:
 *
 *   - fixed  (default): nothing. Every statement this run would have
 *     run is written into the migration script as "COMPLEX — NOT
 *     applied", for review.
 *   - update: safe/additive changes only — CREATE TABLE for a new
 *     entity, ADD COLUMN for a column missing from an existing table,
 *     ADD a foreign key (only when the referenced table already
 *     exists). A column that already exists but with a different
 *     type/nullability is NOT touched — that's "complex", deferred to
 *     the script either way.
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
 * Also v1-scoped: a foreign key is only ever added (a) inline, as part
 * of CREATE TABLE, when its referenced table already exists at that
 * moment, or (b) alongside a brand-new ADD COLUMN on an existing table,
 * same condition. There's no dependency-ordering across entities within
 * one build run (if A references B and both are new, whichever is
 * processed first just defers A's FK to the script) and no retrofitting
 * a FK onto a column that already existed before this attribute was
 * added to it. Both are real gaps worth closing later — deliberately
 * not attempted here rather than half-implemented.
 */
final class SchemaBuilder
{
    private readonly SchemaInspector $inspector;
    private readonly SchemaDiffer $differ;
    private readonly DdlGenerator $generator;
    private readonly MigrationWriter $writer;

    /**
     * @param 'fixed'|'update'|'force' $tableWrite
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
        $complexDeferred = 0;
        $errors = [];
        $entries = [];

        foreach ($entityClasses as $entityClass) {
            try {
                $entity = EntityScanner::scan($entityClass);
                $diff = $this->differ->diff($entity);

                if ($diff->isEmpty()) {
                    continue;
                }

                $result = $diff->isNewTable ? $this->applyNewTable($entity) : $this->applyExisting($entity, $diff);

                $tablesCreated += $result['tablesCreated'];
                $columnsAdded += $result['columnsAdded'];
                $foreignKeysAdded += $result['foreignKeysAdded'];
                $complexDeferred += $result['complexDeferred'];

                $entries[] = ['table' => $entity->table, 'applied' => $result['applied'], 'deferred' => $result['deferred']];
            } catch (Throwable $e) {
                // One bad entity doesn't stop the rest — same "report,
                // don't abort" spirit as BuildCommand's own route-build
                // step, just scoped per-entity instead of per-command.
                $errors[] = "$entityClass: {$e->getMessage()}";
            }
        }

        $migrationFile = $this->writer->write($entries);

        return new BuildReport($tablesCreated, $columnsAdded, $foreignKeysAdded, $complexDeferred, $migrationFile, $errors);
    }

    /** @return array{tablesCreated: int, columnsAdded: int, foreignKeysAdded: int, complexDeferred: int, applied: list<string>, deferred: list<array{sql: string, reason: string}>} */
    private function applyNewTable(EntityDefinition $entity): array
    {
        $applied = [];
        $deferred = [];
        $tablesCreated = 0;
        $foreignKeysAdded = 0;

        // Only inline the FKs whose referenced table is already there —
        // see this class's docblock on why cross-entity ordering within
        // one run isn't attempted.
        $creatableFkColumns = [];

        foreach ($entity->columns as $column) {
            if ($column->references === null) {
                continue;
            }

            if ($this->inspector->tableExists($column->references['table'])) {
                $creatableFkColumns[] = $column->name;
            } else {
                $deferred[] = [
                    'sql' => $this->generator->addForeignKey($entity->table, $column),
                    'reason' => "referenced table `{$column->references['table']}` doesn't exist yet",
                ];
            }
        }

        $createSql = $this->generator->createTable($entity, $creatableFkColumns);

        if ($this->tableWrite === 'fixed') {
            $deferred[] = ['sql' => $createSql, 'reason' => 'TABLE_WRITE=fixed — nothing is applied automatically'];
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
            'complexDeferred' => 0,
            'applied' => $applied,
            'deferred' => $deferred,
        ];
    }

    /** @return array{tablesCreated: int, columnsAdded: int, foreignKeysAdded: int, complexDeferred: int, applied: list<string>, deferred: list<array{sql: string, reason: string}>} */
    private function applyExisting(EntityDefinition $entity, TableDiff $diff): array
    {
        $applied = [];
        $deferred = [];
        $columnsAdded = 0;
        $foreignKeysAdded = 0;
        $complexDeferred = 0;

        foreach ($diff->missingColumns as $column) {
            $sql = $this->generator->addColumn($entity->table, $column);

            if ($this->tableWrite === 'fixed') {
                $deferred[] = ['sql' => $sql, 'reason' => 'TABLE_WRITE=fixed — nothing is applied automatically'];
            } else {
                $this->connection->statement($sql);
                $applied[] = $sql;
                $columnsAdded++;
            }

            if ($column->references === null) {
                continue;
            }

            $fkSql = $this->generator->addForeignKey($entity->table, $column);
            $referencedExists = $this->inspector->tableExists($column->references['table']);

            if ($this->tableWrite !== 'fixed' && $referencedExists) {
                $this->connection->statement($fkSql);
                $applied[] = $fkSql;
                $foreignKeysAdded++;
            } else {
                $deferred[] = [
                    'sql' => $fkSql,
                    'reason' => match (true) {
                        $this->tableWrite === 'fixed' => 'TABLE_WRITE=fixed — nothing is applied automatically',
                        default => "referenced table `{$column->references['table']}` doesn't exist yet",
                    },
                ];
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
                    'reason' => $this->tableWrite === 'fixed'
                        ? 'TABLE_WRITE=fixed — nothing is applied automatically'
                        : 'a column type/nullability change — needs TABLE_WRITE=force, review first',
                ];
                $complexDeferred++;
            }
        }

        return [
            'tablesCreated' => 0,
            'columnsAdded' => $columnsAdded,
            'foreignKeysAdded' => $foreignKeysAdded,
            'complexDeferred' => $complexDeferred,
            'applied' => $applied,
            'deferred' => $deferred,
        ];
    }
}
