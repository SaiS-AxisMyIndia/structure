<?php

declare(strict_types=1);

namespace ProSql;

use PDO;
use PDOException;
use ProSql\Exceptions\QueryException;

/**
 * A lazily-opened MySQL connection, equivalent to a Spring Data
 * DataSource/JdbcTemplate combo: everything in this package talks to MySQL
 * through this class, and it never connects until the first query runs.
 */
class Connection
{
    private ?PDO $pdo = null;

    /**
     * @param array{host: string, port: int|string, database: string, username: string, password: string, charset?: string, options?: array} $config
     */
    public function __construct(private readonly array $config)
    {
    }

    public function pdo(): PDO
    {
        return $this->pdo ??= $this->connect();
    }

    /** The configured database name — e.g. for a Schema\SchemaInspector query against information_schema, which needs it explicitly rather than relying on "whatever database this connection defaults to". */
    public function database(): string
    {
        return $this->config['database'];
    }

    private function connect(): PDO
    {
        $charset = $this->config['charset'] ?? 'utf8mb4';
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            $this->config['host'],
            $this->config['port'] ?? 3306,
            $this->config['database'],
            $charset,
        );

        $options = ($this->config['options'] ?? []) + [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            return new PDO($dsn, $this->config['username'], $this->config['password'], $options);
        } catch (PDOException $e) {
            throw new QueryException("Could not connect to MySQL: {$e->getMessage()}", previous: $e);
        }
    }

    /** @param array<int|string, mixed> $bindings */
    public function statement(string $sql, array $bindings = []): \PDOStatement
    {
        try {
            $stmt = $this->pdo()->prepare($sql);
            $stmt->execute($bindings);

            return $stmt;
        } catch (PDOException $e) {
            throw new QueryException("Query failed: {$e->getMessage()}", $sql, $bindings, $e);
        }
    }

    /**
     * @param array<int|string, mixed> $bindings
     * @return list<array<string, mixed>>
     */
    public function select(string $sql, array $bindings = []): array
    {
        return $this->statement($sql, $bindings)->fetchAll();
    }

    public function lastInsertId(): string
    {
        return $this->pdo()->lastInsertId();
    }

    public function transaction(callable $callback): mixed
    {
        $this->pdo()->beginTransaction();

        try {
            $result = $callback($this);
            $this->pdo()->commit();

            return $result;
        } catch (\Throwable $e) {
            $this->pdo()->rollBack();

            throw $e;
        }
    }
}
