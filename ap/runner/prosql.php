<?php

declare(strict_types=1);

// MySQL connection config for packages/pro-sql — consumed by
// ProSql\ProSqlModule via Runner::get('prosql'). Reads DB_* straight from
// $_ENV, which runner/runner.php already populated from .env.<env>
// before this file is required.

// TABLE_WRITE governs how far `gg build`'s entity-table sync (see
// ProSqlModule::build() / Schema\SchemaBuilder) is allowed to go —
// 'update': safe/additive changes applied automatically; 'migrate'
// (default): report only, nothing touched in the database — every
// statement (dependency-ordered first, so linked tables come out in
// an order that's actually runnable) is written into the migration
// script instead; 'force': everything 'update' does, plus
// complex/destructive changes too. Validated here, not left to fail
// confusingly wherever it's first read — a typo fatals the build
// immediately instead of silently behaving like 'migrate'.
$tableWrite = $_ENV['TABLE_WRITE'] ?? 'migrate';

if (!in_array($tableWrite, ['update', 'migrate', 'force'], true)) {
    throw new InvalidArgumentException(
        "TABLE_WRITE must be one of: update, migrate, force; got \"$tableWrite\".",
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
