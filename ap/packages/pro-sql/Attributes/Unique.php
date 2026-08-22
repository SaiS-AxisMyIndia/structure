<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;

/**
 * Marks a single column as unique on its own — no two rows may share
 * the same value in it:
 *
 *   #[Unique]
 *   public string $mail;
 *
 * A bare marker, no arguments — for "these two columns together must
 * be unique" (not each independently), see UniqueMap instead.
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
class Unique
{
}
