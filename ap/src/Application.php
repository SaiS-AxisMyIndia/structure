<?php

declare(strict_types=1);

namespace App;

use App\Services\PostService;
use App\Services\UserService;
use ApiPro\Container;
use ApiPro\Module;
use ApiPro\Runner;

/**
 * The application's main class — equivalent to a @SpringBootApplication
 * class: it declares which services get bound into the container and which
 * controllers get wired into the router when the app boots. The
 * controller list itself lives in runner/controllers.php, read here via
 * Runner::get('controllers') rather than hardcoded.
 */
class Application extends Module
{
    public function prefix(): string
    {
        return '/api';
    }

    public function register(Container $container): void
    {
        $container->singleton(UserService::class);
        $container->singleton(PostService::class);
    }

    public function controllers(): array
    {
        return Runner::get('controllers');
    }
}
