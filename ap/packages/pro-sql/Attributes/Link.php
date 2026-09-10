<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;
use InvalidArgumentException;
use ValueError;

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
 *
 * $onDelete/$onUpdate optionally set the constraint's `ON DELETE`/`ON
 * UPDATE` behavior (any ReferentialAction case, lowercase or upper —
 * validated the same lazy way $type is on Primary):
 *
 *   #[Link('users.id', onDelete: 'cascade')]
 *   public string $ownerId;
 *
 * Left null (the default, and the only option before this), the
 * constraint carries neither clause — MySQL's own implicit default,
 * RESTRICT.
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
class Link
{
    public readonly string $table;
    public readonly string $column;
    public readonly ?ReferentialAction $onDelete;
    public readonly ?ReferentialAction $onUpdate;

    /** @throws ValueError if $onDelete/$onUpdate is given and isn't one of ReferentialAction's cases */
    public function __construct(public readonly string $reference, ?string $onDelete = null, ?string $onUpdate = null)
    {
        $parts = explode('.', $reference);

        if (count($parts) !== 2 || $parts[0] === '' || $parts[1] === '') {
            throw new InvalidArgumentException(
                "Link reference must be exactly \"table.column\" (e.g. \"roles.id\"); got \"$reference\".",
            );
        }

        [$this->table, $this->column] = $parts;
        $this->onDelete = $onDelete === null ? null : ReferentialAction::from(strtoupper($onDelete));
        $this->onUpdate = $onUpdate === null ? null : ReferentialAction::from(strtoupper($onUpdate));
    }
}
