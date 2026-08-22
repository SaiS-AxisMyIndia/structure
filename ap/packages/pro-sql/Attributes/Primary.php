<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;
use ValueError;

/**
 * Marks a property as the entity's primary key and what column type it
 * should be:
 *
 *   #[Primary('uuid')]
 *   public string $id;
 *
 * The string is validated against PrimaryType (int/uuid/bigint) right
 * here in the constructor — but attributes are lazy: that validation
 * only actually runs once something calls
 * `$reflectionAttribute->newInstance()` on it (nothing in ProSql does,
 * yet — see ProEntity's docblock), not merely by the attribute being
 * written in source. `ValueError` (not a custom exception) is what
 * `PrimaryType::from()` itself throws for an unrecognized value — left
 * as-is rather than wrapped, so the message stays PHP's own precise
 * "not a valid backing value for enum" rather than a paraphrase of it.
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
class Primary
{
    public readonly PrimaryType $type;

    /** @throws ValueError if $type isn't one of PrimaryType's cases */
    public function __construct(string $type)
    {
        $this->type = PrimaryType::from($type);
    }
}
