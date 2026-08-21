<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\UserService;
use ApiPro\Attributes\Middleware;
use ApiPro\Attributes\PostMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Packet;
use ApiPro\Request;
use ApiPro\Response;
use Session\Session;
use Session\SessionMiddleware;

/**
 * Real login, unlike HealthController::ping()'s "anonymous" demo token —
 * this one actually checks credentials (UserService::authenticate())
 * before issuing a session. mandatory: false because you obviously don't
 * have a token yet when you're trying to get one.
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
    public function login(Request $request): array
    {
        $mail = $request->body->getMail('mail');
        $password = $request->body->getPassword('password');

        $user = $this->userService->authenticate($mail, $password);

        if ($user === null) {
            Response::json((new Packet())->failed('Invalid credentials'), 401);
        }

        $this->session->create((string) $user['id'], $user);

        return ['status' => 'LOGGED_IN', 'user' => $user];
    }
}
