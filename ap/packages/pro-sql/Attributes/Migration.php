<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;
use ReflectionClass;

/**
 * Attaches a raw block of hand-written SQL to an entity — an escape
 * hatch for whatever #[Primary]/#[Link]/#[Timestamp]/#[Unique] on the
 * entity's own properties can't express (a seed INSERT, a VIEW, a plain
 * non-unique INDEX, a stored procedure, ...). Executed VERBATIM by
 * SchemaBuilder, split only on ";" — never diffed against the database
 * the way #[ProEntity]'s own columns are (see SchemaDiffer), never
 * validated, never type-checked. What you write is exactly what runs:
 *
 *   #[ProEntity('products')]
 *   #[Migration("
 *       CREATE INDEX idx_products_category ON products (category);
 *       INSERT IGNORE INTO tags (name) VALUES ('featured');
 *   ")]
 *   class ProductEntity { ... }
 *
 * The ";" split is naive — a semicolon inside a string literal or
 * comment splits too, so keep each statement free of an embedded ";".
 * It runs under the same TABLE_WRITE gating as the rest of this
 * entity's schema work, and at the same TIME — see SchemaBuilder — which
 * means it runs again on every LATER build that has anything else to
 * apply for this entity (a new column, a new table), not just the very
 * first time. Nothing here makes re-running it safe: that's on whoever
 * writes the SQL (`INSERT IGNORE`, `CREATE INDEX IF NOT EXISTS`, ...),
 * exactly like a hand-written migration always has been.
 */
#[Attribute(Attribute::TARGET_CLASS)]
class Migration
{
    public function __construct(public readonly string $sql)
    {
    }

    /** @return list<string> non-empty, trimmed statements — a naive split on ";", see the class docblock */
    public function statements(): array
    {
        return array_values(array_filter(
            array_map(trim(...), explode(';', $this->sql)),
            static fn (string $statement): bool => $statement !== '',
        ));
    }

    /**
     * Reflects $entityClass for a class-level #[Migration] and returns
     * it — or null if it doesn't declare one, which is the common case:
     * unlike #[ProEntity], this is genuinely optional.
     */
    public static function of(string $entityClass): ?self
    {
        $attributes = (new ReflectionClass($entityClass))->getAttributes(self::class);

        return $attributes === [] ? null : $attributes[0]->newInstance();
    }
}
