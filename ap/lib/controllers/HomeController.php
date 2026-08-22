<?php

declare(strict_types=1);

namespace Lib\Controllers;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Page;
use ApiPro\Request;
use ApiPro\Runner;
use App\Services\PostService;

/**
 * The site's homepage — one of five single-action classes split out of
 * what used to be App\Controllers\SiteController (see the sibling
 * files in this directory for docs/releases/about/contact). Deliberately
 * NOT the same class as App\Controllers\HomeController, which still
 * exists and now only holds createPost() — the API endpoint this page's
 * own "Live demo" section (lib/page/HomePage.php) actually calls.
 * Identical short class name, different namespace, genuinely different
 * job — don't confuse the two.
 */
#[RestController(prefix: '/site')]
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
}
