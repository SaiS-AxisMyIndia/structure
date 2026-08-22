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

    /** @return array<string, string> */
    public function runnerTemplate(): array
    {
        return ['session.php' => <<<'PHP'
            <?php

            declare(strict_types=1);

            // JWT-style session config for packages/session — consumed by
            // Session\SessionModule via Runner::get('session'). Reads SESSION_*
            // straight from $_ENV, which runner/runner.php already populated from
            // .env.<env> before this file is required.

            return [
                'secret' => $_ENV['SESSION_SECRET'] ?? 'change-me-in-.env.<env>',
                'ttl' => (int) ($_ENV['SESSION_TTL'] ?? 3600),
                'refresh_ttl' => (int) ($_ENV['SESSION_REFRESH_TTL'] ?? 1_209_600),
                'version' => (int) ($_ENV['SESSION_VERSION'] ?? 1),
                'enc' => filter_var($_ENV['SESSION_ENC'] ?? false, FILTER_VALIDATE_BOOLEAN),
            ];

            PHP];
    }
}
