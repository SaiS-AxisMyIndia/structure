<?php

declare(strict_types=1);

namespace App\Controllers;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\PostMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Packet;
use ApiPro\Page;
use ApiPro\Request;
use App\Services\PostService;

/**
 * A sample page demonstrating ApiPro\Page's view mode: a complete,
 * hand-written PHP page (lib/page/HomePage.php) with a real, interactive
 * list — its own JS POSTs to createPost() below and appends the result,
 * no page reload needed.
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
            ->props(['posts' => $this->postService->all()]);
    }

    #[PostMapping('/posts')]
    public function createPost(Request $request): Packet
    {
        $text = $request->body->getString('text');

        return (new Packet())->success($this->postService->create($text), 'Post created');
    }
}
