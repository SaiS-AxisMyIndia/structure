<?php

declare(strict_types=1);
use App\Application;

return [
    'name' => 'gerogo',
    'version' => $_ENV['VERSION'] ?? '1.0.0',
    'env' => $_ENV['APP_ENV'] ?? 'local',
    'base_path' => __DIR__,

    'modules' => [
        '@pro-sql' => '1.0.0',
        '@session' => '1.0.0',
        '@tester' => '1.0.0',
        '@app-viewer' => '1.0.0',
        Application::class,
    ],
];
