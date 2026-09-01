<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repo\UserRepo;
use Gerogo\Attributes\DeleteMapping;
use Gerogo\Attributes\GetMapping;
use Gerogo\Attributes\Middleware;
use Gerogo\Attributes\PostMapping;
use Gerogo\Attributes\PutMapping;
use Gerogo\Attributes\RestController;
use Gerogo\Packet;
use Gerogo\PacketFailed;
use Gerogo\PacketSuccess;
use Gerogo\Request;
use Session\SessionMiddleware;
use Tester\Tester;

// mandatory: false — a token isn't required to call any action here, but
// if the client sends one (e.g. from /ap/v1/health/ping) it resolves and
// authenticates the request normally. Nothing is echoed back either way,
// though: only create()/createRefresh() (login, refresh) put anything in
// the response — see Session::response(). See HealthController::ping()
// for the pattern that issues a brand-new token unconditionally, if
// that's what's wanted here too.
//
// Every action here talks to the real `users` table through UserRepo —
// the same table AuthController's login()/register() (via UserService,
// which wraps this same UserRepo) already check credentials against, so
// a user created here can log in immediately, same as one created via
// /auth/register.
#[RestController(prefix: '/users')]
#[Middleware(new SessionMiddleware())]
class UserController
{
    // Constructor injection — the Container resolves UserRepo the same
    // way it resolves any service, autowiring the Connection UserRepo's
    // base ProRepo needs in turn.
    public function __construct(private readonly UserRepo $userRepo)
    {
    }

    #[GetMapping]
    public function index(Request $request): array
    {
        Tester::comment('List every user — real rows from the `users` table.');

        return $this->userRepo->all();
    }

    #[GetMapping('/{id}')]
    public function show(Request $request): array|Packet|PacketFailed
    {
        Tester::comment("Fetch one user by id.\nReturns 404 (via PacketFailed) if no user with that id exists.");

        $id = $request->params->getString('id');
        $user = $this->userRepo->find($id);

        if ($user === null) {
            return new PacketFailed('User not found', 3);
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
        Tester::comment("Create a real user row.\n\nRequired: name, mail (valid email), password (non-empty).");

        // Plaintext, matching UserService::authenticate()'s own
        // demo-only comparison elsewhere in this app — hash this
        // (password_hash()) before this table ever holds a real user's
        // password; see UserEntity's own docblock on the same point.
        $name = $request->body->getString('name');
        $mail = $request->body->getMail('mail');
        $password = $request->body->getPassword('password');

        $id = $this->userRepo->create(['name' => $name, 'mail' => $mail, 'password' => $password]);

        return new PacketSuccess('User created', data: $this->userRepo->find($id));
    }

    #[PutMapping('/{id}')]
    public function update(Request $request): array|Packet|PacketFailed
    {
        Tester::comment(
            "Update a user by id.\n\nAny of name/mail/password may be sent — only the ones actually present in "
                . "the body are changed, the rest are left as they were.\nReturns 404 if no user with that id exists.",
        );

        $id = $request->params->getString('id');

        if ($this->userRepo->find($id) === null) {
            return new PacketFailed('User not found', 3);
        }

        $attributes = [];

        foreach (['name', 'mail', 'password'] as $field) {
            if ($request->body->has($field)) {
                $attributes[$field] = $request->body->getString($field);
            }
        }

        if ($attributes !== []) {
            $this->userRepo->updateById($id, $attributes);
        }

        return $this->userRepo->find($id);
    }

    #[DeleteMapping('/{id}')]
    public function destroy(Request $request): Packet|PacketFailed
    {
        Tester::comment("Delete a user by id.\nReturns 404 if no user with that id exists.");

        $id = $request->params->getString('id');

        if ($this->userRepo->find($id) === null) {
            return new PacketFailed('User not found', 3);
        }

        $this->userRepo->deleteById($id);

        return new PacketSuccess('User deleted');
    }
}
