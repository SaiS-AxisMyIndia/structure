<?php

declare(strict_types=1);

namespace Gerogo\Attributes;

use Attribute;

/**
 * Marks a class as a service/component, equivalent to Spring's @Service.
 * Purely documentational for the container (which autowires by type-hint
 * regardless), but keeps module code self-describing like Spring beans.
 */
#[Attribute(Attribute::TARGET_CLASS)]
class Service
{
    public function __construct(public ?string $id = null)
    {
    }
}
