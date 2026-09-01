<?php

declare(strict_types=1);

namespace AppViewer;

use Gerogo\Container;
use Gerogo\Module;
use Gerogo\Runner;

/**
 * Wires AppViewer into the Kernel: contributes AppViewerController — but
 * only when Runner::get('app_viewer')['enabled'] says so
 * (runner/app_viewer.php, APP_VIEWER_ENABLED in .env), the exact same
 * on/off pattern as Tester\TesterModule. Binds nothing into the
 * container; there's nothing to configure beyond that one switch.
 * Self-configuring, no constructor args — so it can be booted purely
 * from app.php's `'@app-viewer' => '1.0.0'` entry.
 */
class AppViewerModule extends Module
{
    public function register(Container $container): void
    {
    }

    public function controllers(): array
    {
        return $this->enabled() ? [AppViewerController::class] : [];
    }

    private function enabled(): bool
    {
        return (bool) (Runner::get('app_viewer')['enabled'] ?? true);
    }

    /** @return array<string, string> */
    public function runnerTemplate(): array
    {
        return ['app_viewer.php' => <<<'PHP'
            <?php

            declare(strict_types=1);

            // Config for packages/app-viewer — a Tester-style explorer for this
            // app's Page-returning routes, served at /app-viewer. Consumed by
            // AppViewer\AppViewerModule via Runner::get('app_viewer'). Enabled by
            // default (dev convenience); set APP_VIEWER_ENABLED=false in .env.production
            // before deploying somewhere it shouldn't be publicly reachable — same
            // reasoning as TESTER_ENABLED.

            return [
                'enabled' => filter_var($_ENV['APP_VIEWER_ENABLED'] ?? true, FILTER_VALIDATE_BOOLEAN),
            ];

            PHP];
    }
}
