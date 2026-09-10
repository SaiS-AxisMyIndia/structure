<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;
use InvalidArgumentException;

/**
 * Restricts a column to a fixed, explicit set of values — spelled right
 * there on the property, no separate PHP enum class needed (compare
 * EntityScanner::sqlTypeForEnum(), the other route to the same MySQL
 * ENUM(...) type, via a real string-backed `enum` on the property's own
 * type instead of this attribute):
 *
 *   #[Enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])]
 *   public string $status;
 *
 *   #[Enum([1, 2, 3, 4])]
 *   public int $categoryCode;
 *
 * A STRING-valued list maps the column to MySQL's own ENUM(...), same
 * as a string-backed PHP enum would — the property must be typed
 * `string`/`?string` to match.
 *
 * An INT-valued list keeps the column a real INT instead of ENUM(...):
 * MySQL's ENUM sorts/compares by each value's DEFINITION POSITION, not
 * the label's own numeric value — the wrong semantics for something
 * meant to be compared or sorted numerically. A `CHECK (... IN (...))`
 * constraint enforces the restriction instead — see
 * EntityScanner::enumColumn(). The property must be typed `int`/`?int`
 * to match.
 *
 * $index optionally adds a plain, non-unique index on the column (the
 * one kind of index neither #[Unique] nor #[UniqueMap] can express) —
 * a natural fit for a column this commonly filtered on, e.g. `WHERE
 * status = 'published'`. Defaults to false: most enum-like columns are
 * fine scanned, and an index is not free to maintain on every write.
 *
 * $values must be non-empty and either ALL strings or ALL integers —
 * mixing the two (or anything non-scalar) throws immediately, the same
 * "fail loudly the moment something reflects on this" rule every other
 * ProSql attribute follows.
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
class Enum
{
    /** @param list<string>|list<int> $values */
    public function __construct(
        public readonly array $values,
        public readonly bool $index = false,
    ) {
        if ($values === []) {
            throw new InvalidArgumentException('#[Enum] needs at least one value.');
        }

        $allStrings = true;
        $allInts = true;

        foreach ($values as $value) {
            $allStrings = $allStrings && is_string($value);
            $allInts = $allInts && is_int($value);
        }

        if (!$allStrings && !$allInts) {
            throw new InvalidArgumentException(
                '#[Enum] values must be ALL strings or ALL integers, never mixed — got: '
                . implode(', ', array_map(get_debug_type(...), $values)) . '.',
            );
        }
    }

    /** True for a string-valued list (-> ENUM(...)); false for an int-valued one (-> INT + CHECK). $values is non-empty and homogeneous, guaranteed by the constructor. */
    public function isStringBacked(): bool
    {
        return is_string($this->values[0]);
    }
}
