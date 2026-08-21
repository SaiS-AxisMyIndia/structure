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
}
