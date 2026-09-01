<?php

declare(strict_types=1);

namespace Gerogo;

use FilesystemIterator;
use ReflectionClass;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;

/**
 * Finds every class under a set of directories that carries a given
 * attribute — the mechanism behind `apc build --clean` regenerating
 * runner/controllers.php / runner/entities.php from what's actually in
 * the filesystem (via #[RestController]/#[ProEntity]) instead of a
 * hand-maintained list that can drift out of sync with reality, or get
 * lost entirely if the file itself is ever deleted.
 *
 * Generic and app-agnostic on purpose — it doesn't know what
 * "controllers" or "entities" are, just "classes under these
 * directories carrying this attribute". App\Application (not this
 * class) is what decides which directories and which attribute to look
 * for, since that's an app-specific convention, not a framework one.
 *
 * FQCNs are computed from each file's path against the root
 * composer.json's own PSR-4 map — not by requiring the file and
 * inspecting get_declared_classes() (fragile: picks up every class any
 * required file happens to trigger the autoloading of, not just the
 * one file being scanned) and not by parsing `namespace`/`class` out of
 * the source text (RouteCompiler already does exactly that elsewhere
 * for a different reason — reading Tester::comment()'s literal
 * argument — but a second, slightly-different tokenizer for this would
 * just be one more place the same kind of parsing bug could live).
 */
final class ClassDiscovery
{
    /**
     * @param list<string> $directories absolute paths to scan, recursively; a missing directory is just skipped, not an error
     * @return list<class-string> sorted, so regenerated output is deterministic run to run
     */
    public static function findClassesWithAttribute(string $basePath, array $directories, string $attributeClass): array
    {
        $psr4 = self::psr4Map($basePath);
        $found = [];

        foreach ($directories as $directory) {
            if (!is_dir($directory)) {
                continue;
            }

            foreach (self::phpFilesIn($directory) as $file) {
                $class = self::classNameFor($file, $psr4);

                if ($class === null || !class_exists($class)) {
                    continue;
                }

                $reflection = new ReflectionClass($class);

                if ($reflection->isAbstract() || $reflection->isInterface()) {
                    continue;
                }

                if ($reflection->getAttributes($attributeClass) !== []) {
                    $found[] = $class;
                }
            }
        }

        sort($found);

        return $found;
    }

    /** @return list<string> absolute paths */
    private static function phpFilesIn(string $directory): array
    {
        $files = [];
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS),
        );

        foreach ($iterator as $fileInfo) {
            if ($fileInfo->isFile() && $fileInfo->getExtension() === 'php') {
                $files[] = $fileInfo->getPathname();
            }
        }

        return $files;
    }

    /**
     * @return array<string, string> namespace prefix => absolute directory
     *         (no trailing slash), longest directory first so a nested
     *         PSR-4 root always wins over a shorter parent one
     */
    private static function psr4Map(string $basePath): array
    {
        $composer = json_decode((string) file_get_contents("$basePath/composer.json"), true);
        $psr4 = is_array($composer) ? ($composer['autoload']['psr-4'] ?? []) : [];
        $map = [];

        foreach ($psr4 as $prefix => $path) {
            $map[$prefix] = rtrim("$basePath/$path", '/');
        }

        uasort($map, static fn (string $a, string $b): int => strlen($b) <=> strlen($a));

        return $map;
    }

    private static function classNameFor(string $file, array $psr4): ?string
    {
        foreach ($psr4 as $prefix => $directory) {
            if (!str_starts_with($file, "$directory/")) {
                continue;
            }

            // Strip the matched directory + "/" off the front and ".php"
            // off the back, then translate the remaining path segments
            // into the sub-namespace PSR-4 says they map to.
            $relative = substr($file, strlen($directory) + 1, -4);

            return $prefix . str_replace('/', '\\', $relative);
        }

        return null;
    }
}
