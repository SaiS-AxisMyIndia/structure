<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\UserService;
use ApiPro\Attributes\Middleware;
use ApiPro\Attributes\PostMapping;
use ApiPro\Attributes\RestController;
use ApiPro\PacketFailed;
use ApiPro\Request;
use Session\Session;
use Session\SessionMiddleware;

/**
 * Real login, unlike HealthController::ping()'s "anonymous" demo token —
 * this one actually checks credentials (UserService::authenticate())
 * before issuing a session. mandatory: false because you obviously don't
 * have a token yet when you're trying to get one.
 *
 * login() and refresh() are the ONLY places a client sees a `token` /
 * `refresh_token` — every other endpoint just resolve()s whatever token
 * came in to authenticate the request, without echoing anything back.
 * See Session::response() for the mechanics.
 */
#[RestController(prefix: '/auth')]
#[Middleware(new SessionMiddleware(mandatory: false))]
class AuthController
{
    public function __construct(
        private readonly UserService $userService,
        private readonly Session $session,
    ) {
    }

    #[PostMapping('/login')]
    public function login(Request $request): array|PacketFailed
    {
        $mail = $request->body->getMail('mail');
        $password = $request->body->getPassword('password');

        $user = $this->userService->authenticate($mail, $password);

        if ($user === null) {
            return new PacketFailed('Invalid credentials', 0);
        }

        $this->session->create((string) $user['id'], $user);
        $this->session->createRefresh((string) $user['id']);

        return ['status' => 'LOGGED_IN', 'user' => $user];
    }


    #[PostMapping('/refresh')]
    public function refresh(Request $request): array|PacketFailed
    {
        $refreshToken = $request->body->getString('refresh_token');
        $decoded = $this->session->resolveRefresh($refreshToken);

        if ($decoded === null) {
            return new PacketFailed('Invalid or expired refresh token', 0, 401);
        }

        $user = $this->userService->find((int) $decoded->id);

        if ($user === null) {
            return new PacketFailed('User not found', 0, 401);
        }

        $this->session->create($decoded->id, $user);
        $this->session->createRefresh($decoded->id);

        return ['status' => 'REFRESHED', 'user' => $user];
    }
}
