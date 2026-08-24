<?php

declare(strict_types=1);

namespace ProSql;

use ProSql\Attributes\Primary;
use ProSql\Attributes\PrimaryType;
use ProSql\Attributes\ProEntity;

/**
 * Base CRUD repository, equivalent to extending Spring Data's
 * JpaRepository<T, ID> — the closest PHP (no real generics at runtime)
 * gets to that shape is a docblock convention:
 *
 *   @extends ProRepo<UserEntity>
 *   class UserRepo extends ProRepo
 *   {
 *       protected string $entityClass = UserEntity::class;
 *   }
 *
 * $entityClass is the one thing every subclass actually MUST set — the
 * table name (ProEntity::of()->table) and, for a uuid primary key, how
 * to generate one (Primary::of() — see newPrimaryKey()) both come from
 * that entity's own attributes instead of being redeclared by hand and
 * risking drifting out of sync with them. Override/add methods for
 * anything more specific (a join, a custom WHERE — see query()).
 *
 * @template TEntity of object
 */
abstract class ProRepo
{
    /** Which #[ProEntity]-carrying class this repo's rows hydrate as — see the class docblock. */
    protected string $entityClass;

    protected string $primaryKey = 'id';

    private readonly string $table;

    public function __construct(protected readonly Connection $connection)
    {
        $this->table = ProEntity::of($this->entityClass)->table;
    }

    /**
     * The starting point for anything beyond the plain CRUD below — a
     * custom method (like UserRepo::findByMail()) builds on this the
     * same way create()/find()/etc. do, via ->where()/->join()/->select()/
     * etc. (see QueryBuilder), already scoped to this repo's own table.
     */
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
        $generatedId = $this->newPrimaryKey();

        if ($generatedId === null) {
            return $this->query()->insert($attributes);
        }

        $this->query()->insert([$this->primaryKey => $generatedId, ...$attributes]);

        return $generatedId;
    }

    /**
     * Supplies a primary key value BEFORE insert, for a table whose
     * #[Primary] isn't auto-incrementing (uuid) — reads $entityClass's
     * own #[Primary] attribute (see Attributes\Primary::of()) for both
     * type AND version, so a uuid entity's id generation lives in
     * exactly one place: the #[Primary(...)] declaration on the entity
     * itself, never duplicated (and never able to drift out of sync) in
     * the repo. Returns null — leaving $attributes untouched and relying
     * on the database's own AUTO_INCREMENT + lastInsertId() instead —
     * when $entityClass declares no #[Primary] at all, or declares an
     * int/bigint one.
     */
    protected function newPrimaryKey(): int|string|null
    {
        $primary = Primary::of($this->entityClass);

        if ($primary === null || $primary->type !== PrimaryType::Uuid) {
            return null;
        }

        return $primary->version === 6 ? Uuid::v6() : Uuid::v4();
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
