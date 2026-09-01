<?php

declare(strict_types=1);

namespace Lib\Controllers;

use Gerogo\Attributes\GetMapping;
use Gerogo\Attributes\PageController;
use Gerogo\Page;
use Gerogo\Request;

/**
 * The framework's documentation page — one of five single-action
 * classes split out of what used to be App\Controllers\SiteController
 * (see the sibling files in this directory for home/releases/about/contact).
 */
#[PageController(prefix: '/site')]
class DocsController
{
    #[GetMapping('/docs')]
    public function docs(Request $request): Page
    {
        return new Page($request, 'DocsPage');
    }
}
