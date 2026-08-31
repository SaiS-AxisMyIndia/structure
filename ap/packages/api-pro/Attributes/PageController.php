<?php

declare(strict_types=1);

namespace ApiPro\Attributes;

use Attribute;

/**
 * Marks a class as an HTML page controller — the counterpart to
 * #[RestController] for routes that render a Page instead of returning
 * a Packet. RouteCompiler enforces the split at compile time: every
 * routed action on a #[PageController] class must declare `Page` as its
 * return type, and no #[RestController] action is ever allowed to (see
 * RouteCompiler::assertReturnType()) — Page rendering belongs to
 * #[PageController] alone. The optional prefix is prepended to every
 * route path defined on the class, same as #[RestController].
 */
#[Attribute(Attribute::TARGET_CLASS)]
class PageController
{
    public function __construct(public string $prefix = '')
    {
    }
}
