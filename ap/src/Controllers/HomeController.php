<?php

declare(strict_types=1);

namespace App\Controllers;

use Gerogo\Attributes\PostMapping;
use Gerogo\Attributes\RestController;
use Gerogo\Packet;
use Gerogo\PacketSuccess;
use Gerogo\Request;
use App\Services\PostService;

/**
 * Backs the "Live demo" section on SiteController::home()'s page
 * (lib/page/HomePage.php's embedded JS posts here) — the one real,
 * callable endpoint proving Page + Packet actually work together, not
 * just marketing copy. Every actual page (including that same home
 * page, and docs()) moved to SiteController; this class is API-shaped,
 * not page-shaped, which is exactly why it stayed behind rather than
 * moving along with them.
 */
#[RestController(prefix: '/gerogo')]
class HomeController
{
    public function __construct(private readonly PostService $postService)
    {
    }

    #[PostMapping('/posts')]
    public function createPost(Request $request): Packet
    {
        $text = $request->body->getString('text');

        return new PacketSuccess('Post created', data: $this->postService->create($text));
    }
}
