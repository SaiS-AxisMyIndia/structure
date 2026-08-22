<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;
use InvalidArgumentException;

/**
 * Marks a property as a foreign key into another entity's column — the
 * ProSql equivalent of JPA's @ManyToOne/@JoinColumn, spelled as one
 * `table.column` string rather than a pair of arguments:
 *
 *   #[Link('roles.id')]
 *   public string $roleId;
 *
 * Parsed eagerly in the constructor into $table/$column ('roles'/'id'
 * above) — a malformed reference (no dot, or an empty table/column
 * name either side of it) throws immediately rather than surfacing as a
 * confusing failure wherever $table/$column get read later. As with
 * every other ProSql attribute, that only happens once something
 * actually reflects on and instantiates it — see ProEntity's docblock.
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
class Link
{
    public readonly string $table;
    public readonly string $column;

    public function __construct(public readonly string $reference)
    {
        $parts = explode('.', $reference);

        if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            throw new InvalidArgumentException(
                "Link reference must be exactly \"table.column\" (e.g. \"roles.id\"); got \"$reference\".",
            );
        }

        [$this->table, $this->column] = $parts;
    }
}
