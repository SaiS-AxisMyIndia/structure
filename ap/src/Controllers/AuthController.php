<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\UserService;
use Gerogo\Attributes\Middleware;
use Gerogo\Attributes\PostMapping;
use Gerogo\Attributes\RestController;
use Gerogo\Packet;
use Gerogo\PacketFailed;
use Gerogo\PacketSuccess;
use Gerogo\Request;
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
        // device_id: a client-supplied identifier for the device that's
        // logging in — optional, '' when a client doesn't send one.
        // role: which permissions this session carries — optional, and a
        // LIST since a session can hold more than one at once (e.g.
        // ["admin", "editor"]) — [] when absent. Both getters read
        // directly off $request->body here (not a shared helper) so
        // RouteCompiler::fieldsOf() — the same static scan that finds
        // `mail`/`password` above — picks them up as real fields too
        // (see its own docblock: it only scans an action's OWN source,
        // not anything it calls out to), which is what makes them show
        // up in Tester's/AppViewer's Request panel for this route.
        $deviceId = $request->body->getString('device_id', '');
        $role = $request->body->getJson('role', []);

        $user = $this->userService->authenticate($mail, $password);

        if ($user === null) {
            throw new PacketFailed('Invalid credentials', 0);
        }

        $extras = ['device_id' => $deviceId, 'role' => $role];

        // Both ride inside the session token's own data (Session::create()'s
        // $data param), not just this response's `user` field, so a later
        // resolve() of this same token — e.g. inside middleware guarding a
        // role-gated route — can read them back via Session::current()->data.
        $this->session->create((string) $user['id'], [...$user, ...$extras]);
        $this->session->createRefresh((string) $user['id'], $extras);

        return new PacketSuccess(data: ['status' => 'LOGGED_IN', 'user' => $user]);
    }


    #[PostMapping('/register')]
    public function register(Request $request): Packet
    {
        $name = $request->body->getString('name');
        $mail = $request->body->getMail('mail');
        $password = $request->body->getPassword('password');
        // See login()'s own comment on device_id/role.
        $deviceId = $request->body->getString('device_id', '');
        $role = $request->body->getJson('role', []);

        $user = $this->userService->register($name, $mail, $password);

        if ($user === null) {
            throw new PacketFailed('Mail already registered', 0, 409);
        }

        $extras = ['device_id' => $deviceId, 'role' => $role];

        $this->session->create((string) $user['id'], [...$user, ...$extras]);
        $this->session->createRefresh((string) $user['id'], $extras);

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

        // The client resends only the refresh token here, not device_id/
        // role again — so those ride forward from the refresh token's OWN
        // data (set at login()/register() time, passed to createRefresh()
        // there) rather than being lost on every refresh.
        $extras = [
            'device_id' => $decoded->data['device_id'] ?? '',
            'role' => $decoded->data['role'] ?? [],
        ];

        $this->session->create($decoded->id, [...$user, ...$extras]);
        $this->session->createRefresh($decoded->id, $extras);

        return new PacketSuccess(data: ['status' => 'REFRESHED', 'user' => $user]);
    }
}
