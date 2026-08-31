<?php

declare(strict_types=1);

namespace Lib\Controllers;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\PageController;
use ApiPro\Page;
use ApiPro\Request;

/**
 * The "what this project is" page — one of five single-action classes
 * split out of what used to be App\Controllers\SiteController (see the
 * sibling files in this directory for home/docs/releases/contact).
 */
#[PageController(prefix: '/site')]
class AboutController
{
    #[GetMapping('/about')]
    public function about(Request $request): Page
    {
        $request->params->getString('role');
        return new Page($request, 'AboutPage');
    }
}
