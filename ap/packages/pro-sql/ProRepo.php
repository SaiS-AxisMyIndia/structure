<?php

declare(strict_types=1);

namespace ProSql;

/**
 * Base CRUD repository, equivalent to extending Spring Data's
 * JpaRepository<T, ID>: subclass it, set $table/$primaryKey, and get
 * findAll/find/create/update/delete for free. Override or add methods for
 * anything more specific.
 */
abstract class ProRepo
{
    protected string $table;
    protected string $primaryKey = 'id';

    public function __construct(protected readonly Connection $connection)
    {
    }

    protected function query(): QueryBuilder
    {
        return QueryBuilder::make($this->connection)->table($this->table);
    }

    /** @return list<array<string, mixed>> */
    public function all(): array
    {
        return $this->query()->get();
    }

    /** @return array<string, mixed>|null */
    public function find(int|string $id): ?array
    {
        return $this->query()->where($this->primaryKey, '=', $id)->first();
    }

    /** @param array<string, mixed> $attributes */
    public function create(array $attributes): int|string
    {
        return $this->query()->insert($attributes);
    }

    /** @param array<string, mixed> $attributes */
    public function updateById(int|string $id, array $attributes): int
    {
        return $this->query()->where($this->primaryKey, '=', $id)->update($attributes);
    }

    public function deleteById(int|string $id): int
    {
        return $this->query()->where($this->primaryKey, '=', $id)->delete();
    }
}
