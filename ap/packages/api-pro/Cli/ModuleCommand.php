<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;

/**
 * `apc module <name> [version]` — shows one packages/<name> module's
 * resolved info: its own composer.json version, and whether/at-what-
 * version app.php's `modules` list references it. With a version
 * argument, validates the installed composer.json version matches
 * exactly (the same check PackageResolver runs at boot).
 *
 * Read-only, like `apc install` — this never edits app.php.
 */
final class ModuleCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        if ($args === []) {
            fwrite(STDERR, "Usage: apc module <name> [version]\n");

            return 1;
        }

        $name = $args[0];
        $expected = $args[1] ?? null;
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
