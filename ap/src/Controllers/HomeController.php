<?php

declare(strict_types=1);

namespace App\Controllers;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\PostMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Packet;
use ApiPro\PacketSuccess;
use ApiPro\Page;
use ApiPro\Request;
use ApiPro\Runner;
use App\Services\PostService;

/**
 * api-pro's own showcase site — a "standard website" (nav, hero, feature
 * grid, quick start) at / (home()), with a live, interactive demo backed
 * by a real endpoint (createPost() below) proving Page + Packet actually
 * work, not just marketing copy. docs() is the framework's documentation,
 * one level in at /docs. Both are ApiPro\Page view-mode pages — complete,
 * hand-written HTML (lib/page/HomePage.php, lib/page/DocsPage.php), not
 * filled-in placeholders.
 */
#[RestController(prefix: '/api-pro')]
class HomeController
{
    public function __construct(private readonly PostService $postService)
    {
    }

    #[GetMapping]
    public function home(Request $request): Page
    {
        // ->title()/->body()/etc. are ignored once ->view() is set — the
        // view file itself is the whole page, title tag included.
        return (new Page())
            ->view('HomePage')
            ->props([
                'posts' => $this->postService->all(),
                'version' => Runner::get('version'),
            ]);
    }

    #[GetMapping('/docs')]
    public function docs(Request $request): Page
    {
        return (new Page())
            ->view('DocsPage')
            ->props(['version' => Runner::get('version')]);
    }

    #[PostMapping('/posts')]
    public function createPost(Request $request): Packet
    {
        $text = $request->body->getString('text');

        return new PacketSuccess($this->postService->create($text), 'Post created');
    }
}
