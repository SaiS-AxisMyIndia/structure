<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\UserService;
use ApiPro\Attributes\Middleware;
use ApiPro\Attributes\PostMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Packet;
use ApiPro\PacketFailed;
use ApiPro\PacketSuccess;
use ApiPro\Request;
use Session\Session;
use Session\SessionMiddleware;

/**
 * Real login, unlike HealthController::ping()'s "anonymous" demo token —
 * this one actually checks credentials (UserService::authenticate())
 * before issuing a session. mandatory: false because you obviously don't
 * have a token yet when you're trying to get one (true of register() too
 * — signing up is the other way to end up with no token yet).
 *
 * login(), register(), and refresh() are the ONLY places a client sees a
 * `token` / `refresh_token` — every other endpoint just resolve()s
 * whatever token came in to authenticate the request, without echoing
 * anything back. See Session::response() for the mechanics.
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
    public function login(Request $request): Packet
    {
        $mail = $request->body->getMail('mail');
        $password = $request->body->getPassword('password');

        $user = $this->userService->authenticate($mail, $password);

        if ($user === null) {
            throw new PacketFailed('Invalid credentials', 0);
        }

        $this->session->create((string) $user['id'], $user);
        $this->session->createRefresh((string) $user['id']);

        return new PacketSuccess(data: ['status' => 'LOGGED_IN', 'user' => $user]);
    }


    #[PostMapping('/register')]
    public function register(Request $request): Packet
    {
        $name = $request->body->getString('name');
        $mail = $request->body->getMail('mail');
        $password = $request->body->getPassword('password');

        $user = $this->userService->register($name, $mail, $password);

        if ($user === null) {
            throw new PacketFailed('Mail already registered', 0, 409);
        }

        $this->session->create((string) $user['id'], $user);
        $this->session->createRefresh((string) $user['id']);

        return new PacketSuccess(data: ['status' => 'REGISTERED', 'user' => $user]);
    }


    #[PostMapping('/refresh')]
    public function refresh(Request $request): Packet
    {
        $refreshToken = $request->body->getString('refresh_token');
        $decoded = $this->session->resolveRefresh($refreshToken);

        if ($decoded === null) {
            throw new PacketFailed('Invalid or expired refresh token', 0, 401);
        }

        $user = $this->userService->find($decoded->id);

        if ($user === null) {
            throw new PacketFailed('User not found', 0, 401);
        }

        $this->session->create($decoded->id, $user);
        $this->session->createRefresh($decoded->id);

        return new PacketSuccess(data: ['status' => 'REFRESHED', 'user' => $user]);
    }
}
