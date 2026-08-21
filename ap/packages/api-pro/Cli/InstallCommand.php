<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;
use Throwable;

/**
 * `apc install [version]` — validates that every module app.php
 * references actually resolves (same check PackageResolver runs on a
 * real boot, surfaced here so a broken reference is caught by a deploy
 * script instead of the first request to hit it). With a version
 * argument, also checks it against app.php's own declared version.
 *
 * This never edits app.php — it only reports what's there.
 */
final class InstallCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $expected = $args[0] ?? null;
        $appVersion = Runner::get('version', 'unknown');
        $ok = true;

        printf("App: %s %s\n", Runner::get('name', 'app'), $appVersion);

        if ($expected !== null) {
            if ($expected === $appVersion) {
                printf("  ✓ matches expected version %s\n", $expected);
            } else {
                fwrite(STDERR, "  ✗ expected $expected, app.php declares $appVersion\n");
                $ok = false;
            }
        }

        echo "\nModules:\n";

        try {
            $modules = Runner::modules();
        } catch (Throwable $e) {
            fwrite(STDERR, '  ✗ ' . $e->getMessage() . "\n");

            return 1;
        }

        foreach ($modules as $module) {
            printf("  ✓ %s\n", $module::class);
        }

        if (!$ok) {
            fwrite(STDERR, "\nInstall check FAILED.\n");

            return 1;
        }

        echo "\nInstall OK.\n";

        return 0;
    }
}
