<?php

declare(strict_types=1);

namespace Lib\Controllers;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Page;
use ApiPro\Request;
use ApiPro\Runner;

/**
 * The "what this project is" page — one of five single-action classes
 * split out of what used to be App\Controllers\SiteController (see the
 * sibling files in this directory for home/docs/releases/contact).
 */
#[RestController(prefix: '/site')]
class AboutController
{
    #[GetMapping('/about')]
    public function about(Request $request): Page
    {
        return (new Page())
            ->view('AboutPage');
    }
}
