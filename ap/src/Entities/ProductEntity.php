<?php

declare(strict_types=1);

namespace App\Entities;

use ProSql\Attributes\Enum;
use ProSql\Attributes\Link;
use ProSql\Attributes\Migration;
use ProSql\Attributes\Primary;
use ProSql\Attributes\ProEntity;
use ProSql\Attributes\Timestamp;
use ProSql\Attributes\Unique;
use ProSql\Attributes\UniqueMap;

/**
 * A reference entity exercising every attribute EntityScanner understands,
 * in one place — pair this with UserEntity/PostEntity (each of which only
 * shows a slice) when you need to see what a single class can declare:
 *
 *   #[Primary('uuid', version: 6)] — time-ordered uuid (see Primary's own
 *       docblock for why 6 sorts the same as insert order, unlike the
 *       default version 4 both other entities use)
 *   #[Link]                        — a foreign key (into `users`), with an
 *       explicit ON DELETE — deleting the owning user takes their
 *       products with it, rather than leaving the constraint at MySQL's
 *       implicit default (RESTRICT, which both other entities' #[Link]s
 *       still get, since they don't pass onDelete/onUpdate at all)
 *   #[Unique]                      — a single column unique on its own ($sku)
 *   #[UniqueMap]                   — a composite constraint across two
 *       columns ($category + $slug must be unique together, not each alone)
 *   #[Timestamp]                   — all three shapes: plain (neither
 *       default nor auto-refresh), current-on-insert, and
 *       current-on-insert-and-update
 *   #[Enum]                        — two shapes, on two columns: a
 *       string-valued list on $status (-> MySQL's own ENUM(...), same as
 *       a real PHP backed enum would map — see EntityScanner::sqlTypeForEnum()
 *       — plus index: true for a plain index right there on the
 *       property) and an int-valued list on $categoryCode (-> stays a
 *       real INT column, with a CHECK (...) constraint instead of
 *       ENUM(...) — see Enum's own docblock for why)
 *   #[Migration]                   — raw SQL that isn't a column at all
 *       (here: a plain, non-unique index on $price — #[Enum(index: true)]
 *       above already covers $status's own index the "declared right on
 *       the property" way), run verbatim alongside this entity's
 *       generated DDL — see that attribute's own docblock
 *   plain columns                  — string, ?string, int, float, bool
 */
#[ProEntity('products')]
#[Migration("
    CREATE INDEX idx_products_price ON products (price);
")]
class ProductEntity
{
    #[Primary('uuid', version: 6)]
    public string $id;

    /** Which `users` row owns this listing — cascades on delete, so a removed user's products go with them. */
    #[Link('users.id', onDelete: 'cascade')]
    public string $ownerId;

    /** Unique on its own — no two products may share a SKU. */
    #[Unique]
    public string $sku;

    /** Jointly unique with $slug (declaring it here, pointing at $slug, is enough — see UniqueMap's docblock). */
    #[UniqueMap('products.slug')]
    public string $category;

    public string $slug;

    public string $name;

    /** Nullable — not every product has one yet. */
    public ?string $description = null;

    public float $price;

    public int $stock;

    public bool $isActive;

    /** String-valued #[Enum] -> MySQL ENUM('DRAFT','PUBLISHED','ARCHIVED'); index: true also gets it a plain index for free. */
    #[Enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'], index: true)]
    public string $status;

    /** Int-valued #[Enum] -> stays a real INT column, with CHECK (`categoryCode` IN (1,2,3,4)) instead of ENUM(...). */
    #[Enum([1, 2, 3, 4])]
    public int $categoryCode;

    /** Plain timestamp: no default, no auto-refresh — set explicitly when the product actually goes live. */
    #[Timestamp]
    public ?string $publishedAt = null;

    #[Timestamp(current: true)]
    public string $createdAt;

    #[Timestamp(current: true, update: true)]
    public string $updatedAt;
}
