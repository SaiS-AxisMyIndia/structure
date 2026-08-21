<?php

declare(strict_types=1);

namespace Session;

use ApiPro\Container;
use ApiPro\Module;
use ApiPro\Runner;

/**
 * Wires Session into the Kernel: builds a SessionConfig from
 * Runner::get('session') — runner/session.php's SESSION_* config — the
 * same way Spring Security reads jwt.secret/jwt.expiration from
 * application.properties. Contributes no controllers. Self-configuring,
 * no constructor args — so it can be booted purely from app.php's
 * `'@session' => '1.0.0'` entry.
 */
class SessionModule extends Module
{
    public function register(Container $container): void
    {
        $sessionConfig = SessionConfig::fromArray(Runner::get('session'));

        $container->singleton(SessionConfig::class, static fn (): SessionConfig => $sessionConfig);
        $container->singleton(SessionCodec::class);
        $container->singleton(Session::class);
    }

    public function controllers(): array
    {
        return [];
    }
}
