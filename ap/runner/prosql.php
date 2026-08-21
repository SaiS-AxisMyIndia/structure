<?php

declare(strict_types=1);

// MySQL connection config for packages/pro-sql — consumed by
// ProSql\ProSqlModule via Runner::get('prosql'). Reads DB_* straight from
// $_ENV, which runner/runner.php already populated from .env before this
// file is required.

return [
    'host' => $_ENV['DB_HOST'] ?? '127.0.0.1',
    'port' => $_ENV['DB_PORT'] ?? 3306,
    'database' => $_ENV['DB_DATABASE'] ?? 'api_pro',
    'username' => $_ENV['DB_USERNAME'] ?? 'root',
    'password' => $_ENV['DB_PASSWORD'] ?? '',
    'charset' => $_ENV['DB_CHARSET'] ?? 'utf8mb4',
];
