<?php

declare(strict_types=1);

namespace Tester;

use ApiPro\Container;
use ApiPro\Module;
use ApiPro\Runner;

/**
 * Wires Tester into the Kernel: contributes TesterController — but only
 * when Runner::get('tester')['enabled'] says so (runner/tester.php,
 * TESTER_ENABLED in .env). Binds nothing into the container; there's
 * nothing to configure beyond that one switch. Self-configuring, no
 * constructor args — so it can be booted purely from app.php's
 * `'@tester' => '1.0.0'` entry.
 */
class TesterModule extends Module
{
    public function register(Container $container): void
    {
    }

    public function controllers(): array
    {
        return $this->enabled() ? [TesterController::class] : [];
    }

    private function enabled(): bool
    {
        return (bool) (Runner::get('tester')['enabled'] ?? true);
    }

    /** @return array<string, string> */
    public function runnerTemplate(): array
    {
        return ['tester.php' => <<<'PHP'
            <?php

            declare(strict_types=1);

            // Config for packages/tester — a Swagger-like interactive API explorer
            // served at /tester. Consumed by Tester\TesterModule via
            // Runner::get('tester'). Enabled by default (dev convenience); set
            // TESTER_ENABLED=false in .env.production before deploying somewhere the endpoint
            // list/explorer shouldn't be publicly reachable.

            return [
                'enabled' => filter_var($_ENV['TESTER_ENABLED'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ];

            PHP];
    }
}
