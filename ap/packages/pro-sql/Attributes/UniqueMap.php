<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;
use InvalidArgumentException;

/**
 * Marks this column as jointly unique together with another column on
 * the SAME entity — not that either column is unique on its own, but
 * that no two rows may share the same *combination* of both:
 *
 *   #[UniqueMap('users.password')]
 *   public string $mail;
 *
 *   public string $password;
 *
 * Declare it on EITHER column, pointing at the other — not both; doing
 * so anyway is harmless (EntityScanner dedupes the pair rather than
 * generating the same composite constraint twice), just redundant.
 *
 * Spelled as "table.column" the same way #[Link] is, but there's no
 * cross-table meaning here — a composite unique constraint only makes
 * sense within one table. EntityScanner validates $table actually
 * matches the entity's own #[ProEntity] table (catching a copy-paste
 * mistake immediately) and that $column names a real property on the
 * same entity — neither check can happen here in the constructor,
 * since this attribute alone has no way to know either of those things
 * about the class it's declared on.
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
class UniqueMap
{
    public readonly string $table;
    public readonly string $column;

    public function __construct(public readonly string $reference)
    {
        $parts = explode('.', $reference);

        if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            throw new InvalidArgumentException(
                "UniqueMap reference must be exactly \"table.column\" (e.g. \"users.password\"); got \"$reference\".",
            );
        }

        [$this->table, $this->column] = $parts;
    }
}
