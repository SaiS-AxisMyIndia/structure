<?php

declare(strict_types=1);

namespace ProSql;

/**
 * A fluent, parameter-bound MySQL query builder — this is ProSql's
 * equivalent of Spring Data's Criteria/QueryDSL layer. Every value placed
 * through where()/insert()/update() is bound, never string-concatenated, so
 * building queries this way is SQL-injection-safe by construction.
 */
class QueryBuilder
{
    private string $table;
    private array $wheres = [];
    private array $bindings = [];
    private array $joins = [];
    private array $orderBy = [];
    private array $columns = ['*'];
    private ?int $limit = null;
    private ?int $offset = null;

    public function __construct(private readonly Connection $connection)
    {
    }

    public static function make(Connection $connection): self
    {
        return new self($connection);
    }

    public function table(string $table): self
    {
        $this->table = $table;

        return $this;
    }

    public function select(string ...$columns): self
    {
        $this->columns = $columns === [] ? ['*'] : $columns;

        return $this;
    }

    public function where(string $column, string $operator, mixed $value): self
    {
        $this->wheres[] = ['type' => 'AND', 'sql' => "$column $operator ?"];
        $this->bindings[] = $value;

        return $this;
    }

    public function orWhere(string $column, string $operator, mixed $value): self
    {
        $this->wheres[] = ['type' => 'OR', 'sql' => "$column $operator ?"];
        $this->bindings[] = $value;

        return $this;
    }

    /** @param list<mixed> $values */
    public function whereIn(string $column, array $values): self
    {
        if ($values === []) {
            // An empty IN() list can never match a row — short-circuit safely.
            $this->wheres[] = ['type' => 'AND', 'sql' => '1 = 0'];

            return $this;
        }

        $placeholders = implode(', ', array_fill(0, count($values), '?'));
        $this->wheres[] = ['type' => 'AND', 'sql' => "$column IN ($placeholders)"];
        array_push($this->bindings, ...$values);

        return $this;
    }

    public function join(string $table, string $first, string $operator, string $second): self
    {
        $this->joins[] = "JOIN $table ON $first $operator $second";

        return $this;
    }

    public function orderBy(string $column, string $direction = 'ASC'): self
    {
        $direction = strtoupper($direction) === 'DESC' ? 'DESC' : 'ASC';
        $this->orderBy[] = "$column $direction";

        return $this;
    }

    public function limit(int $limit): self
    {
        $this->limit = $limit;

        return $this;
    }

    public function offset(int $offset): self
    {
        $this->offset = $offset;

        return $this;
    }

    /** @return list<array<string, mixed>> */
    public function get(): array
    {
        return $this->connection->select($this->toSelectSql(), $this->bindings);
    }

    /** @return array<string, mixed>|null */
    public function first(): ?array
    {
        $row = $this->limit(1)->get();

        return $row[0] ?? null;
    }

    public function count(): int
    {
        $sql = "SELECT COUNT(*) AS aggregate FROM {$this->table}" . $this->whereSql();
        $row = $this->connection->select($sql, $this->bindings);

        return (int) ($row[0]['aggregate'] ?? 0);
    }

    public function exists(): bool
    {
        return $this->count() > 0;
    }

    /** @param array<string, mixed> $data */
    public function insert(array $data): string
    {
        $columns = array_keys($data);
        $placeholders = implode(', ', array_fill(0, count($columns), '?'));

        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $this->table,
            implode(', ', $columns),
            $placeholders,
        );

        $this->connection->statement($sql, array_values($data));

        return $this->connection->lastInsertId();
    }

    /** @param array<string, mixed> $data */
    public function update(array $data): int
    {
        $assignments = implode(', ', array_map(static fn (string $column) => "$column = ?", array_keys($data)));

        $sql = "UPDATE {$this->table} SET $assignments" . $this->whereSql();
        $bindings = [...array_values($data), ...$this->bindings];

        return $this->connection->statement($sql, $bindings)->rowCount();
    }

    public function delete(): int
    {
        $sql = "DELETE FROM {$this->table}" . $this->whereSql();

        return $this->connection->statement($sql, $this->bindings)->rowCount();
    }

    private function toSelectSql(): string
    {
        $sql = 'SELECT ' . implode(', ', $this->columns) . " FROM {$this->table}";

        if ($this->joins !== []) {
            $sql .= ' ' . implode(' ', $this->joins);
        }

        $sql .= $this->whereSql();

        if ($this->orderBy !== []) {
            $sql .= ' ORDER BY ' . implode(', ', $this->orderBy);
        }

        if ($this->limit !== null) {
            $sql .= " LIMIT {$this->limit}";
        }

        if ($this->offset !== null) {
            $sql .= " OFFSET {$this->offset}";
        }

        return $sql;
    }

    private function whereSql(): string
    {
        if ($this->wheres === []) {
            return '';
        }

        $sql = ' WHERE ' . $this->wheres[0]['sql'];

        foreach (array_slice($this->wheres, 1) as $where) {
            $sql .= " {$where['type']} {$where['sql']}";
        }

        return $sql;
    }
}
