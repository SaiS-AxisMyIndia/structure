<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Services\UserService;
use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\Middleware;
use ApiPro\Attributes\PostMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Packet;
use ApiPro\PacketFailed;
use ApiPro\PacketSuccess;
use ApiPro\Request;
use Session\SessionMiddleware;
use Tester\Tester;

// mandatory: false — a token isn't required to call any action here, but
// if the client sends one (e.g. from /api/health/ping) it resolves and a
// re-encoded one comes back attached, same as everywhere else. With no
// incoming token, Session::current() stays null and no `token` field
// appears at all — see HealthController::ping() for the pattern that
// issues a brand-new one unconditionally, if that's what's wanted here too.
#[RestController(prefix: '/users')]
#[Middleware(new SessionMiddleware())]
class UserController
{
    // Constructor injection — the Container resolves UserService automatically,
    // the same way Spring wires a @Service into a @RestController.
    public function __construct(private readonly UserService $userService)
    {
    }

    #[GetMapping]
    public function index(Request $request): array
    {
        return $this->userService->all();
    }

    #[GetMapping('/{id}')]
    public function show(Request $request): array
    {
        Tester::comment("Fetch one user by numeric id.\nReturns 404 (via PacketFailed) if no user with that id exists.");

        // getInt() with no default -> mandatory: a non-integer {id} 400s
        // via PacketFailed before find() is even called.
        $id = $request->params->getInt('id');
        $user = $this->userService->find($id);

        if ($user === null) {
            throw new PacketFailed('User not found', 404);
        }

        return $user;
    }

    // Returns a Packet directly (a PacketSuccess, not ->toArray()) —
    // Kernel/Response::json pass a Packet through as-is; calling
    // ->toArray() here would hand back a plain array instead, which then
    // gets wrapped in a SECOND Packet by Kernel::handle(), double-nesting
    // the response.
    #[PostMapping]
    public function store(Request $request): Packet
    {
        Tester::comment("Validate a new user's mail + password.\n\nRequired: mail (valid email), password (non-empty).\nOptional: roles (JSON array), and a query string ?lang= for the language field.\n\nDoesn't actually persist anything yet — UserService has no create().");

        $mail = $request->body->getMail('mail');
        $password = $request->body->getPassword('password');
        $roles = $request->body->getJson('roles', []);
        $language = $request->query->getString('lang', 'en');

        return new PacketSuccess([
            'mail' => $mail,
            'roles' => $roles,
            'language' => $language,
        ], 'Validated');
    }
}
