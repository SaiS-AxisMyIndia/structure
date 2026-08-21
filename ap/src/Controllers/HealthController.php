<?php

declare(strict_types=1);

namespace App\Controllers;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\Middleware;
use ApiPro\Attributes\PostMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Request;
use Session\Session;
use Session\SessionMiddleware;

// Class-level: every action below requires a valid token unless it
// overrides the middleware itself (mandatory is true by default anyway —
// spelled out here to show the config point).
#[RestController(prefix: '/health')]
#[Middleware(new SessionMiddleware(mandatory: true))]
class HealthController
{
    public function __construct(private readonly Session $session)
    {
    }

    #[GetMapping]
    public function status(Request $request): array
    {
        return [
            'status' => 'UP',
            'timestamp' => date(DATE_ATOM),
        ];
    }

    // Method-level override: reachable with no token at all. Issues one
    // (Session::create) so SessionMiddleware's response() step has
    // something to encode and hand back — that's what lets a client reuse
    // it against /api/health above afterwards.
    #[GetMapping('/ping')]
    #[Middleware(new SessionMiddleware(mandatory: false))]
    public function ping(Request $request): array
    {
        $this->session->create('anonymous', ['pinged_at' => date(DATE_ATOM)]);

        return ['status' => 'PONG'];
    }

    // Requires a valid token (class-level default) and then drops it —
    // Session::logout() — so the response that follows carries no token.
    #[PostMapping('/logout')]
    public function logout(Request $request): array
    {
        $this->session->logout();

        return ['status' => 'LOGGED_OUT'];
    }
}
