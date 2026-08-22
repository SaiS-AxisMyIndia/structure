<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;

/**
 * Marks a property as a timestamp column:
 *
 *   #[Timestamp(current: true)]              // created_at-style
 *   public string $createdAt;
 *
 *   #[Timestamp(current: true, update: true)] // updated_at-style
 *   public string $updatedAt;
 *
 * $current: the column defaults to the current time when a row is
 * created (DB-side `DEFAULT CURRENT_TIMESTAMP`), instead of requiring
 * the value to always be supplied explicitly.
 *
 * $update: the column also refreshes to the current time on every
 * update to the row (DB-side `ON UPDATE CURRENT_TIMESTAMP`) — what
 * actually distinguishes an `updated_at` from a `created_at`; both
 * default to `false`; `#[Timestamp]` alone (no args) marks a plain
 * timestamp column with neither behavior.
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
class Timestamp
{
    public function __construct(
        public readonly bool $current = false,
        public readonly bool $update = false,
    ) {
    }
}
