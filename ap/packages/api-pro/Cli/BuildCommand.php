<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;
use Throwable;

/**
 * `apc build` — the deploy-time build step: force-compiles every module's
 * routes right now and writes storage/routes.cache.php, regardless of
 * `env` (unlike Runner::routes(), which only caches outside `env:
 * local`). The same idea as `npm run build` or Laravel's `route:cache`:
 * do the expensive compile once, ahead of traffic, instead of making the
 * first real request pay for it.
 *
 * `apc build -c|--clean` deletes that cache file, forcing the next boot
 * (CLI or HTTP) to recompile fresh from the controllers' attributes.
 */
final class BuildCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $flag = $args[0] ?? null;

        if ($flag !== null && !in_array($flag, ['-c', '--clean'], true)) {
            fwrite(STDERR, "Usage: apc build [-c|--clean]\n");

            return 1;
        }

        return in_array($flag, ['-c', '--clean'], true) ? $this->clean() : $this->build();
    }

    private function build(): int
    {
        try {
            $routes = Runner::warmRoutes();
        } catch (Throwable $e) {
            fwrite(STDERR, 'Build failed: ' . $e->getMessage() . "\n");

            return 1;
        }

        printf("Resolved %d module(s), compiled %d route(s).\n", count(Runner::modules()), count($routes));
        printf("Cache written: %s\n", Runner::routesCachePath());

        return 0;
    }

    private function clean(): int
    {
        if (Runner::clearRoutesCache()) {
            printf("Removed %s\n", Runner::routesCachePath());
        } else {
            echo "No build cache to remove.\n";
        }

        return 0;
    }
}
