<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;

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
 * This — together with #[Primary]/#[Link]/#[Timestamp] on its
 * properties — is pure declarative metadata for now: nothing in ProSql
 * reflects on it yet. It exists as the shape the table-diffing "apc
 * build" step (create/alter a table to match the entity, per
 * TABLE_WRITE in .env — see todo.md) will read once that's built; a
 * class carrying these attributes today is unaffected by them at
 * runtime either way. `ProRepo::$table`/`$primaryKey` are still set
 * by hand until that reader exists.
 */
#[Attribute(Attribute::TARGET_CLASS)]
class ProEntity
{
    public function __construct(public string $table)
    {
    }
}
