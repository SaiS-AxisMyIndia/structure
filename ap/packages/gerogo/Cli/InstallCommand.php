<?php

declare(strict_types=1);

namespace Gerogo\Cli;

use Gerogo\Runner;
use Throwable;

/**
 * `apc install [module] [version]` — with no module given (or `gerogo`
 * itself, the app's own name — see app.php's `'name'`), validates that
 * every module app.php references actually resolves (same check
 * PackageResolver runs on a real boot, surfaced here so a broken
 * reference is caught by a deploy script instead of the first request to
 * hit it), and with a version argument, checks it against app.php's own
 * declared version.
 *
 * Given any OTHER module name, shows that packages/<name>'s own
 * composer.json version and whether/at-what-version app.php's `modules`
 * list references it instead — a version argument there validates the
 * installed composer.json version matches exactly (the same check
 * PackageResolver runs at boot). This is the merged former
 * `apc module <name> [version]`.
 *
 * Read-only either way — this never edits app.php.
 */
final class InstallCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $module = $args[0] ?? 'gerogo';
        $expected = $args[1] ?? null;

        return $module === 'gerogo'
            ? $this->installApp($expected)
            : $this->installModule($module, $expected);
    }

    private function installApp(?string $expected): int
    {
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

    private function installModule(string $name, ?string $expected): int
    {
        $composerPath = "{$this->basePath}/packages/$name/composer.json";

        if (!is_file($composerPath)) {
            fwrite(STDERR, "Module [$name] not found — no packages/$name/composer.json.\n");

            return 1;
        }

        $composer = json_decode((string) file_get_contents($composerPath), true);
        $installedVersion = is_array($composer) ? ($composer['version'] ?? 'unknown') : 'unknown';
        $declaredVersion = $this->declaredVersionInAppPhp($name);

        printf("%-12s %s\n", 'Package:', is_array($composer) ? ($composer['name'] ?? "paradigm/$name") : "paradigm/$name");
        printf("%-12s %s\n", 'Version:', $installedVersion);
        printf("%-12s %s\n", 'In app.php:', $declaredVersion ?? '(not referenced)');

        if ($expected === null) {
            return 0;
        }

        if ($expected !== $installedVersion) {
            fwrite(STDERR, "\n✗ expected $expected, packages/$name declares $installedVersion\n");

            return 1;
        }

        printf("\n✓ packages/%s matches %s\n", $name, $expected);

        return 0;
    }

    private function declaredVersionInAppPhp(string $name): ?string
    {
        $modules = Runner::get('modules', []);
        $version = $modules["@$name"] ?? null;

        return is_string($version) ? $version : null;
    }
}
