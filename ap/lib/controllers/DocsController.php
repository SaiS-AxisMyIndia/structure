<?php

declare(strict_types=1);

namespace Lib\Controllers;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Page;
use ApiPro\Request;
use ApiPro\Runner;

/**
 * The framework's documentation page — one of five single-action
 * classes split out of what used to be App\Controllers\SiteController
 * (see the sibling files in this directory for home/releases/about/contact).
 */
#[RestController(prefix: '/site')]
class DocsController
{
    #[GetMapping('/docs')]
    public function docs(Request $request): Page
    {
        return (new Page())
            ->view('DocsPage')
            ->props(['version' => Runner::get('version')]);
    }
}
