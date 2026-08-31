<?php

declare(strict_types=1);

namespace Lib\Controllers;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\PageController;
use ApiPro\Page;
use ApiPro\Request;

/**
 * The contact page — one of five single-action classes split out of
 * what used to be App\Controllers\SiteController (see the sibling
 * files in this directory for home/docs/releases/about).
 */
#[PageController(prefix: '/site')]
class ContactController
{
    #[GetMapping('/contact')]
    public function contact(Request $request): Page
    {
        return new Page($request, 'ContactPage');
    }
}
