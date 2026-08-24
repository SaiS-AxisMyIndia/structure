<?php

declare(strict_types=1);

namespace ProSql\Attributes;

use Attribute;
use ReflectionClass;
use ValueError;

/**
 * Marks a property as the entity's primary key and what column type it
 * should be:
 *
 *   #[Primary('uuid')]              // version 4 (random) — the default
 *   public string $id;
 *
 *   #[Primary('uuid', version: 6)]  // time-ordered, sorts the same as insert order
 *   public string $id;
 *
 * $version only means anything for 'uuid' (4 or 6 — see
 * ColumnDefinition::$uuidVersion / DdlGenerator's DEFAULT expressions
 * for what each actually generates) and is ignored for 'int'/'bigint',
 * which have no version concept at all.
 *
 * The string is validated against PrimaryType (int/uuid/bigint) right
 * here in the constructor — but attributes are lazy: that validation
 * only actually runs once something calls
 * `$reflectionAttribute->newInstance()` on it (nothing in ProSql does,
 * yet — see ProEntity's docblock), not merely by the attribute being
 * written in source. `ValueError` (not a custom exception) is what
 * `PrimaryType::from()` itself throws for an unrecognized value — left
 * as-is rather than wrapped, so the message stays PHP's own precise
 * "not a valid backing value for enum" rather than a paraphrase of it;
 * an invalid $version is a ValueError raised here instead, for the same
 * "fail loudly the moment something reflects on this" reason.
 */
#[Attribute(Attribute::TARGET_PROPERTY)]
class Primary
{
    public readonly PrimaryType $type;

    /** Only set (non-null) when $type is 'uuid' — see the class docblock. */
    public readonly ?int $version;

    /** @throws ValueError if $type isn't one of PrimaryType's cases, or $type is 'uuid' and $version isn't 4 or 6 */
    public function __construct(string $type, int $version = 4)
    {
        $this->type = PrimaryType::from($type);

        if ($this->type !== PrimaryType::Uuid) {
            $this->version = null;

            return;
        }

        if ($version !== 4 && $version !== 6) {
            throw new ValueError("Primary('uuid') version must be 4 or 6; got $version.");
        }

        $this->version = $version;
    }

    /**
     * Reflects $entityClass for whichever property carries #[Primary]
     * and returns that attribute instance — or null if none does. This
     * is what lets ProRepo::newPrimaryKey() generate the right kind of
     * id straight from the entity's own declaration (type AND version)
     * instead of a repo having to redeclare it by hand and risk
     * drifting out of sync. Doesn't enforce "exactly one" the way
     * EntityScanner does at build time (the first one found wins) — a
     * real `apc build` would already have caught more than one.
     */
    public static function of(string $entityClass): ?self
    {
        foreach ((new ReflectionClass($entityClass))->getProperties() as $property) {
            $attributes = $property->getAttributes(self::class);

            if ($attributes !== []) {
                return $attributes[0]->newInstance();
            }
        }

        return null;
    }
}
