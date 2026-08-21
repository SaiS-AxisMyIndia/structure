<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;

/** `apc -v` / `apc --version` — the app's own version, plus every packages/* package's. */
final class VersionCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        printf(
            "%s %s (env: %s)\n",
            Runner::get('name', 'app'),
            Runner::get('version', '0.0.0'),
            Runner::get('env', 'local'),
        );

        echo "\nPackages:\n";

        foreach ($this->packageComposerFiles() as $path) {
            $composer = json_decode((string) file_get_contents($path), true);

            if (!is_array($composer)) {
                continue;
            }

            printf("  %-24s %s\n", $composer['name'] ?? basename(dirname($path)), $composer['version'] ?? 'unknown');
        }

        return 0;
    }

    /** @return list<string> */
    private function packageComposerFiles(): array
    {
        $packagesPath = "{$this->basePath}/packages";

        if (!is_dir($packagesPath)) {
            return [];
        }

        $files = [];

        foreach (scandir($packagesPath) ?: [] as $entry) {
            $composerPath = "$packagesPath/$entry/composer.json";

            // Skips e.g. empty packages/cli or packages/tester — a
            // directory with no composer.json isn't an installed package.
            if ($entry !== '.' && $entry !== '..' && is_file($composerPath)) {
                $files[] = $composerPath;
            }
        }

        sort($files);

        return $files;
    }
}
