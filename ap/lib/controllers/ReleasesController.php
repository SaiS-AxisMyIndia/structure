<?php

declare(strict_types=1);

namespace Lib\Controllers;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Page;
use ApiPro\Request;
use ApiPro\Runner;

/**
 * The releases/changelog page — one of five single-action classes
 * split out of what used to be App\Controllers\SiteController (see the
 * sibling files in this directory for home/docs/about/contact).
 */
#[RestController(prefix: '/site')]
class ReleasesController
{
    #[GetMapping('/releases')]
    public function releases(Request $request): Page
    {
        return (new Page())
            ->view('ReleasesPage')
            ->props(['version' => Runner::get('version')]);
    }
}
