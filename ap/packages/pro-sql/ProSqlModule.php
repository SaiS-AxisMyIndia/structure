<?php

declare(strict_types=1);

namespace ProSql;

use Gerogo\Container;
use Gerogo\Module;
use Gerogo\Runner;
use ProSql\Schema\SchemaBuilder;

/**
 * Wires ProSql into the Kernel: binds a single shared Connection, built
 * from Runner::get('prosql') — runner/prosql.php's DB_* config — the same
 * way Spring Boot auto-configures a DataSource bean from
 * spring.datasource.* properties. Contributes no controllers.
 * Self-configuring, no constructor args — so it can be booted purely from
 * app.php's `'@pro-sql' => '1.0.0'` entry.
 */
class ProSqlModule extends Module
{
    public function register(Container $container): void
    {
        $config = Runner::get('prosql');

        $container->singleton(Connection::class, static fn (): Connection => new Connection($config));
    }

    public function controllers(): array
    {
        return [];
    }

    /**
     * `apc build`'s entity-table sync — see SchemaBuilder's own docblock
     * for exactly what each TABLE_WRITE mode is/isn't allowed to do.
     * This is the ONLY place pro-sql's Connection/Schema classes get
     * reached from a build run — gerogo's BuildCommand just calls
     * Module::build() generically on every module (this override is
     * what actually does something with that call) and never
     * references anything in this package directly, keeping the
     * existing dependency direction (pro-sql depends on gerogo, never
     * the reverse) intact.
     *
     * A no-op — returns null, prints nothing — when runner/entities.php
     * is empty, so a project with no entities yet sees no schema output
     * at all from `apc build`.
     */
    public function build(): ?string
    {
        $entityClasses = Runner::get('entities', []);

        if ($entityClasses === []) {
            return null;
        }

        $config = Runner::get('prosql');
        $connection = new Connection($config);
        $tableWrite = $config['table_write'] ?? 'fixed';
        $migrationsPath = Runner::get('base_path') . '/storage/migrations';

        $report = (new SchemaBuilder($connection, $tableWrite, $migrationsPath))->build($entityClasses);

        $summary = sprintf(
            'Schema (TABLE_WRITE=%s): %d table(s) created, %d column(s) added, %d FK(s) added, %d complex change(s) deferred.',
            $tableWrite,
            $report->tablesCreated,
            $report->columnsAdded,
            $report->foreignKeysAdded,
            $report->complexChangesDeferred,
        );

        if ($report->migrationFile !== null) {
            $summary .= "\nMigration script: {$report->migrationFile}";
        }

        foreach ($report->errors as $error) {
            $summary .= "\n  ! $error";
        }

        return $summary;
    }

    /** @return array<string, string> */
    public function runnerTemplate(): array
    {
        return ['prosql.php' => <<<'PHP'
            <?php

            declare(strict_types=1);

            // MySQL connection config for packages/pro-sql — consumed by
            // ProSql\ProSqlModule via Runner::get('prosql'). Reads DB_* straight from
            // $_ENV, which runner/runner.php already populated from .env.<env>
            // before this file is required.

            // TABLE_WRITE governs how far `apc build`'s entity-table sync (see
            // ProSqlModule::build() / Schema\SchemaBuilder) is allowed to go —
            // 'fixed' (default): report only, nothing touched in the database;
            // 'update': safe/additive changes applied automatically; 'force': that
            // plus complex/destructive ones too. Validated here, not left to fail
            // confusingly wherever it's first read — a typo fatals the build
            // immediately instead of silently behaving like 'fixed'.
            $tableWrite = $_ENV['TABLE_WRITE'] ?? 'fixed';

            if (!in_array($tableWrite, ['fixed', 'update', 'force'], true)) {
                throw new InvalidArgumentException(
                    "TABLE_WRITE must be one of: fixed, update, force; got \"$tableWrite\".",
                );
            }

            return [
                'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
                'port' => $_ENV['DB_PORT'] ?? 3306,
                'database' => $_ENV['DB_DATABASE'] ?? 'gerogo',
                'username' => $_ENV['DB_USERNAME'] ?? 'root',
                'password' => $_ENV['DB_PASSWORD'] ?? '',
                'charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
                'table_write' => $tableWrite,
            ];

            PHP];
    }
}
