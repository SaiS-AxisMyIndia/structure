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
