<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Repo\PostRepo;
use Gerogo\Attributes\GetMapping;
use Gerogo\Attributes\Middleware;
use Gerogo\Attributes\PostMapping;
use Gerogo\Attributes\RestController;
use Gerogo\Packet;
use Gerogo\PacketFailed;
use Gerogo\PacketSuccess;
use Gerogo\Request;
use Session\Session;
use Session\SessionMiddleware;
use Tester\Tester;

/**
 * Real, DB-backed posts (see PostEntity) — not to be confused with
 * HomeController's PostService, an in-memory demo backing the homepage's
 * "Live demo" widget. index() is this app's one real example of a
 * complex query: PostRepo::allWithAuthor() joins `posts` to `users`
 * rather than fetching each side separately and stitching them together
 * in PHP.
 *
 * mandatory: false at the class level — browsing posts needs no token;
 * only creating one does (a post needs to know WHO's writing it), so
 * store() overrides mandatory: true for itself alone.
 */
#[RestController(prefix: '/posts')]
#[Middleware(new SessionMiddleware(mandatory: false))]
class PostController
{
    public function __construct(
        private readonly PostRepo $postRepo,
        private readonly Session $session,
    ) {
    }

    #[GetMapping]
    public function index(Request $request): array
    {
        Tester::comment(
            'Every post with its author\'s name/mail attached — a real JOIN against `users` '
                . '(PostRepo::allWithAuthor()), not two separate queries.',
        );

        return $this->postRepo->allWithAuthor();
    }

    #[PostMapping]
    #[Middleware(new SessionMiddleware(mandatory: true))]
    public function store(Request $request): Packet
    {
        Tester::comment("Create a post as the current authenticated user.\n\nRequired: text (non-empty).");

        $text = $request->body->getString('text');
        $token = $this->session->current();

        if ($token === null) {
            // Unreachable in practice — mandatory: true above already
            // guarantees a resolved token before this method ever runs —
            // but $session->current() itself is nullable, so this is
            // handled rather than asserted away.
            throw new PacketFailed('Not authenticated', 0, 401);
        }

        $id = $this->postRepo->create(['userId' => $token->id, 'text' => $text]);

        return new PacketSuccess('Post created', data: $this->postRepo->find($id));
    }
}
