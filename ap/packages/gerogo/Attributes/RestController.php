<?php

declare(strict_types=1);

namespace Gerogo\Attributes;

use Attribute;

/**
 * Marks a class as an HTTP controller, equivalent to Spring's @RestController.
 * The optional prefix is prepended to every route path defined on the class.
 */
#[Attribute(Attribute::TARGET_CLASS)]
class RestController
{
    public function __construct(public string $prefix = '')
    {
    }
}
