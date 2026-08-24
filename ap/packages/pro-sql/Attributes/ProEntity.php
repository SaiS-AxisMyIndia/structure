<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;
use LogicException;
use ReflectionClass;

/**
 * Marks a class as mapping to a real table — the ProSql equivalent of
 * JPA's @Entity/@Table:
 *
 *   #[ProEntity('users')]
 *   class User
 *   {
 *       #[Primary('uuid')]
 *       public string $id;
 *
 *       #[Timestamp(current: true)]
 *       public string $createdAt;
 *
 *       #[Timestamp(current: true, update: true)]
 *       public string $updatedAt;
 *
 *       #[Link('roles.id')]
 *       public string $roleId;
 *   }
 *
 * Together with #[Primary]/#[Link]/#[Timestamp] on its properties, this
 * is what EntityScanner reads at build time (`apc build`'s table-diffing
 * step) — and, via of() below, what ProRepo::$entityClass reads at
 * RUNTIME too: a repo declares which entity it is once, instead of
 * redeclaring its table name (and, for a uuid primary key, its type —
 * see Attributes\Primary::of()) by hand.
 */
#[Attribute(Attribute::TARGET_CLASS)]
class ProEntity
{
    public function __construct(public string $table)
    {
    }

    /**
     * Reflects $entityClass for its class-level #[ProEntity] attribute
     * and returns that attribute instance. Throws rather than returning
     * null — unlike Primary::of() (a uuid primary key is optional; this
     * isn't), ProRepo::$entityClass having no #[ProEntity] at all is
     * always a mistake, not a valid "none declared" case.
     *
     * @throws LogicException if $entityClass carries no #[ProEntity]
     */
    public static function of(string $entityClass): self
    {
        $attributes = (new ReflectionClass($entityClass))->getAttributes(self::class);

        if ($attributes === []) {
            throw new LogicException("$entityClass has no #[ProEntity] attribute — nothing to map a ProRepo's table from.");
        }

        return $attributes[0]->newInstance();
    }
}
