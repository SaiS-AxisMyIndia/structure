<?php

declare(strict_types=1);

namespace Gerogo\Attributes;

use Gerogo\MiddlewareInterface;
use Attribute;

/**
 * Declares which middleware run around a controller (class-level, applies
 * to every action) or a single action (method-level) — the config point the
 * user asked for: "these should be config in control[ler] declaration".
 * Equivalent to stacking Spring @Component interceptors via a
 * WebMvcConfigurer, but declared right on the controller instead.
 *
 * Each entry is either a plain class-string (built with its constructor
 * defaults) or, since PHP 8.1 allows `new` inside attribute arguments, a
 * configured instance:
 *
 *   #[RestController(prefix: '/api/health')]
 *   #[Middleware(new SessionMiddleware(mandatory: true))]   // class default is also true
 *   class HealthController
 *   {
 *       #[GetMapping('/ping')]
 *       #[Middleware(new SessionMiddleware(mandatory: false))]  // overrides for this one action
 *       public function ping(Request $request): array { ... }
 *   }
 *
 * A configured instance is built directly by PHP (bypassing the
 * container), so it only ever carries scalar config — the Router pulls
 * that config back out and asks the container to build the real,
 * fully-wired instance from it (see Router::resolveMiddleware()).
 *
 * List more entries to chain more middleware later — order is preserved,
 * class-level then method-level, outermost first.
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class Middleware
{
    /** @var list<class-string<MiddlewareInterface>|MiddlewareInterface> */
    public readonly array $middleware;

    public function __construct(string|MiddlewareInterface ...$middleware)
    {
        $this->middleware = $middleware;
    }
}
