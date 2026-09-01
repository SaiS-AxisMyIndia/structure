<?php

declare(strict_types=1);

namespace Gerogo\Attributes;

use Attribute;

/**
 * Declares a Module's base path — the same thing overriding
 * Module::prefix() does, just declaratively, matching how a
 * controller declares its own prefix via #[RestController(prefix:
 * ...)] instead of a method:
 *
 *   #[BaseRoot('/api/v1')]
 *   class Application extends Module { ... }
 *
 * Module::prefix() reads this attribute by default — a Module can
 * still override prefix() directly instead (e.g. to compute a prefix
 * at runtime rather than a fixed string); that override simply takes
 * priority the normal way method overriding always does.
 */
#[Attribute(Attribute::TARGET_CLASS)]
class BaseRoot
{
    public function __construct(public string $prefix)
    {
    }
}
