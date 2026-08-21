<?php

declare(strict_types=1);

namespace ApiPro;

use RuntimeException;

/**
 * Resolves an `app.php` `'@name' => 'version'` module entry to a Module
 * instance — always looked up under packages/, right alongside this
 * framework. Roughly a lightweight Maven/Gradle coordinate ("boot exactly
 * this declared version"), except the artifact is always a local path
 * package, never fetched from a registry.
 *
 * The module class itself is derived from the package's own
 * composer.json PSR-4 autoload prefix, by convention: a package
 * autoloading "Foo\\" is expected to declare "Foo\FooModule" — which is
 * exactly how paradigm/pro-sql (ProSql\ProSqlModule) and paradigm/session
 * (Session\SessionModule) are already laid out.
 */
final class PackageResolver
{
    public function __construct(private readonly string $packagesPath)
    {
    }

    public function resolve(string $name, string $version): Module
    {
        $composerPath = "{$this->packagesPath}/{$name}/composer.json";

        if (!is_file($composerPath)) {
            throw new RuntimeException(
                "Module [@$name => $version] not found — expected packages/$name/composer.json to exist "
                . '(module packages always live under /packages).',
            );
        }

        $composer = json_decode((string) file_get_contents($composerPath), true);

        if (!is_array($composer)) {
            throw new RuntimeException("packages/$name/composer.json is not valid JSON.");
        }

        $installedVersion = $composer['version'] ?? null;

        if ($installedVersion !== $version) {
            $found = $installedVersion ?? 'unknown';

            throw new RuntimeException(
                "Module [@$name => $version] requested in app.php, but packages/$name declares version [$found].",
            );
        }

        $moduleClass = $this->moduleClassOf($composer, $name);

        if (!class_exists($moduleClass)) {
            throw new RuntimeException(
                "Module [@$name => $version] resolved to class [$moduleClass], which does not exist.",
            );
        }

        return new $moduleClass();
    }

    /** @param array<string, mixed> $composer */
    private function moduleClassOf(array $composer, string $name): string
    {
        $psr4 = $composer['autoload']['psr-4'] ?? null;

        if (!is_array($psr4) || $psr4 === []) {
            throw new RuntimeException("packages/$name/composer.json declares no PSR-4 autoload mapping.");
        }

        $namespace = rtrim((string) array_key_first($psr4), '\\');

        return "$namespace\\{$namespace}Module";
    }
}
