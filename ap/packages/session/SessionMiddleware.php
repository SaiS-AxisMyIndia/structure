<?php

declare(strict_types=1);

namespace Session;

use ApiPro\MiddlewareInterface;
use ApiPro\Packet;
use ApiPro\PacketFailed;
use ApiPro\Request;
use LogicException;

/**
 * Resolves the incoming bearer/cookie token into the current Session
 * before the controller runs, then wraps whatever the controller returns
 * through Session::response() so the (possibly re-encoded) token always
 * travels back out with the response.
 *
 * Declare it on a controller (class-level, every action) or a single
 * action (method-level), configuring `mandatory` per declaration:
 *
 *   #[RestController(prefix: '/api/health')]
 *   #[Middleware(new SessionMiddleware(mandatory: true))]   // default anyway
 *   class HealthController
 *   {
 *       #[GetMapping('/ping')]
 *       #[Middleware(new SessionMiddleware(mandatory: false))]  // this action only
 *       public function ping(Request $request): array { ... }
 *   }
 *
 * `mandatory: true` (the default) rejects with a "Token expired" 401
 * before the controller ever runs if no valid token came in. `mandatory:
 * false` lets the request through regardless — the controller itself may
 * still call Session::create() (e.g. a login action) to issue one.
 *
 * `$session` defaults to null on purpose: when this class is built
 * directly with `new` inside the attribute above, PHP has no container to
 * inject it — Router::resolveMiddleware() detects that and asks the
 * container to build a real instance from this one's config instead.
 */
class SessionMiddleware implements MiddlewareInterface
{
    private const COOKIE = 'session_token';

    public function __construct(
        private readonly bool $mandatory = true,
        private readonly ?Session $session = null,
    ) {
    }

    public function handle(Request $request, callable $next): mixed
    {
        $session = $this->session ?? throw new LogicException(
            self::class . ' was used without a Session — resolve it through the container, '
            . 'not by calling handle() on an attribute-built config template.',
        );

        $token = $request->bearerToken() ?? $request->cookie(self::COOKIE);
        $resolved = $token !== null ? $session->resolve($token) : null;

        if ($this->mandatory && $resolved === null) {
            throw new PacketFailed('Token expired', 0, 401);
        }

        $result = $next($request);

        // A PacketFailed can be thrown OR returned from the controller.
        // Thrown, it skips this entirely via normal PHP exception
        // propagation — Kernel::handle()'s catch block is the only thing
        // that ever sees it, no token re-attached. A RETURNED one has to
        // be caught here explicitly for the same thing to happen: it's
        // not a Packet, so left unhandled it would fall into the
        // "wrap as success data" branch below instead — passing it
        // straight through (unconverted; Kernel does that) keeps both
        // paths behaving identically.
        if ($result instanceof PacketFailed) {
            return $result;
        }

        $packet = $result instanceof Packet ? $result : (new Packet())->success($result);

        return $session->response($packet);
    }
}
