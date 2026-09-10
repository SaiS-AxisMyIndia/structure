<?php

declare(strict_types=1);

namespace Gerogo\Attributes;

use Attribute;

/**
 * Declares a Module's base path for its #[PageController]s only — the
 * #[PageRoot] counterpart to #[BaseRoot], for a module whose pages need
 * to live under a different base path than its REST routes (e.g. REST
 * under '/api/v1' while pages are served at the site root):
 *
 *   #[BaseRoot('/api/v1')]
 *   #[PageRoot('/')]
 *   class Application extends Module { ... }
 *
 * Module::pagePrefix() reads this attribute by default and falls back to
 * #[BaseRoot]/prefix() when it's absent — a module with no page-specific
 * concerns doesn't need to think about this at all. A Module can still
 * override pagePrefix() directly instead (e.g. to compute it at runtime
 * rather than as a fixed string); that override takes priority the
 * normal way method overriding always does.
 */
#[Attribute(Attribute::TARGET_CLASS)]
class PageRoot
{
    public function __construct(public string $prefix)
    {
    }
}
