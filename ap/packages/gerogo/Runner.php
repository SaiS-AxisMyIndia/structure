<?php

declare(strict_types=1);

namespace Gerogo;

use RuntimeException;

/**
 * The one place environment (.env.local / .env.production / ...),
 * application (app.php), modules, and routes get resolved for the
 * running request — equivalent to Spring's
 * ApplicationContext: built once at startup, and everything downstream
 * (Kernel, every Module, every controller/service) asks it for a value
 * instead of redoing that work itself.
 *
 * `runner/runner.php` calls Runner::boot() exactly once, up front — also
 * loading every runner/<name>.php module config file into this config
 * under that same key (e.g. runner/prosql.php -> Runner::get('prosql')).
 * Kernel then pulls Runner::modules() (already resolved — never
 * re-resolved via PackageResolver a second time) and Runner::routes()
 * (already compiled from every controller's attributes — see
 * RouteCompiler) and just dispatches: no config re-reading, no module
 * re-resolving, no attribute re-scanning anywhere else. In production
 * (`env` other than `local`), routes() also writes/reuses
 * storage/routes.cache.php so that compiling happens once ever, not once
 * per request.
 */
final class Runner
{
    /** @var array<string, mixed>|null */
    private static ?array $config = null;

    /** @var list<Module>|null */
    private static ?array $modules = null;

    /** @var list<array>|null */
    private static ?array $routes = null;

    /**
     * The real environments this app knows about out of the box — not a
     * closed/enforced set: a real APP_ENV process env var, or an explicit
     * -f/--flavour apc flag, is free to name anything else too (see
     * envFilePath()'s own comment). Purely a documented default list.
     */
    public const STAGES = ['local', 'production', 'staging'];

    /**
     * "Flavour" is this app's word for "which environment" — env and
     * flavour mean the same thing here, there's no second axis. Booting
     * as a given flavour means, and only ever means, loading that one
     * .env.<flavour> file (see envFilePath()).
     *
     * @param string|null $flavour which flavour to boot as — 'local',
     *        'production', 'staging' (see self::STAGES), or any other
     *        name a real APP_ENV happens to carry. There's no plain .env
     *        fallback: this app always knows which flavour it's running
     *        as explicitly (a -f/--flavour apc flag, or a real APP_ENV
     *        set in the actual process environment) rather than
     *        implicitly via whichever loose .env file happens to be
     *        sitting on disk. Defaults to a real APP_ENV env var if one
     *        is set, else 'local'.
     */
    public static function boot(string $basePath, ?string $flavour = null): void
    {
        if (self::$config !== null) {
            return; // already booted this request — never redo the work
        }

        $flavour ??= getenv('APP_ENV') ?: 'local';

        self::loadEnvFile(self::envFilePath($basePath, $flavour));
        $_ENV['APP_ENV'] ??= $flavour;

        $config = require "$basePath/app.php";
        $config['base_path'] ??= $basePath;

        // Per-module config lives in runner/, one file per module, keyed
        // by that file's own name — e.g. Runner::get('prosql') for
        // runner/prosql.php. A module reads its own key instead of
        // building its config from $_ENV itself.
        //
        // A missing file degrades to [] rather than fataling here —
        // deliberately: this loop runs before ANY apc command (this is
        // the one call every entry point makes first, `apc` included),
        // so a hard require() would make `apc build --clean` — whose
        // whole job is regenerating a missing/wiped runner/ directory
        // from scratch (see Module::runnerTemplate()) — unable to ever
        // run in exactly the situation it exists to fix. The degraded
        // [] is enough for that one command; anything else touching a
        // module's real config while runner/ is in this state gets
        // whatever that module does with an empty array (e.g. missing
        // DB_HOST/etc.), not a silently-wrong default invented here.
        foreach (['prosql', 'session', 'controllers', 'tester', 'entities', 'app_viewer'] as $key) {
            $path = "$basePath/runner/$key.php";
            $config[$key] = is_file($path) ? require $path : [];
        }

        self::$config = $config;
    }

    /** @return array<string, mixed> */
    public static function config(): array
    {
        return self::$config ?? throw new RuntimeException(
            'Runner::boot() must run before Runner::config()/get() — see runner/runner.php.',
        );
    }

    /** A value from app.php's returned config (name/version/env/modules/...). */
    public static function get(string $key, mixed $default = null): mixed
    {
        return self::config()[$key] ?? $default;
    }

    /** A raw environment variable (DB_HOST, SESSION_SECRET, ...), loaded from .env.<env> by boot(). */
    public static function env(string $key, mixed $default = null): mixed
    {
        return $_ENV[$key] ?? $default;
    }

    /**
     * Every module app.php lists — resolved exactly once (a `'@name' =>
     * 'version'` pair through PackageResolver, a plain class-string via
     * `new $class()`, or an already-built instance passed through as-is).
     * Kernel::registerModules() reuses this list rather than resolving
     * modules itself; routes() below reuses it too, so a package
     * reference is only ever looked up once per request no matter how
     * many things need to know about its module.
     *
     * @return list<Module>
     */
    public static function modules(): array
    {
        if (self::$modules !== null) {
            return self::$modules;
        }

        $config = self::config();
        $resolver = new PackageResolver("{$config['base_path']}/packages");
        $modules = [];

        foreach ($config['modules'] ?? [] as $key => $entry) {
            $modules[] = match (true) {
                $entry instanceof Module => $entry,
                is_string($key) && str_starts_with($key, '@') => $resolver->resolve(substr($key, 1), $entry),
                default => new $entry(),
            };
        }

        return self::$modules = $modules;
    }

    /**
     * The full compiled route table — every module's controllers, run
     * through RouteCompiler, merged into one list. Router just loads this
     * and matches/dispatches; nothing reflects on a controller's
     * attributes at request time.
     *
     * In `env: local` this is rebuilt fresh every request (so editing a
     * controller takes effect immediately) but still only once *within*
     * that request. In any other env it's written to
     * storage/routes.cache.php the first time and simply read back after
     * that — delete that file to force a rebuild once you've deployed a
     * routing change.
     *
     * @return list<array{method: string, regex: string, controller: class-string, action: string, path: string, middleware: array}>
     */
    public static function routes(): array
    {
        if (self::$routes !== null) {
            return self::$routes;
        }

        $isProduction = (self::config()['env'] ?? 'local') !== 'local';
        $cachePath = self::routesCachePath();

        if ($isProduction && is_file($cachePath)) {
            return self::$routes = require $cachePath;
        }

        $compiled = self::compileAll();

        if ($isProduction) {
            self::writeCache($cachePath, $compiled);
        }

        return self::$routes = $compiled;
    }

    /**
     * Forces a fresh compile and cache write regardless of `env` — the
     * apc CLI's `build` command uses this to warm the cache ahead of
     * traffic, instead of leaving the first real request to pay for it.
     *
     * @return list<array>
     */
    public static function warmRoutes(): array
    {
        $compiled = self::compileAll();

        self::writeCache(self::routesCachePath(), $compiled);

        return self::$routes = $compiled;
    }

    /** Deletes the route cache file, if one exists. Used by `apc build --clean` and `apc clean`. */
    public static function clearRoutesCache(): bool
    {
        $path = self::routesCachePath();

        if (!is_file($path)) {
            return false;
        }

        unlink($path);

        return true;
    }

    public static function routesCachePath(): string
    {
        return self::config()['base_path'] . '/storage/routes.cache.php';
    }

    /**
     * Deletes the whole runner/ directory — not just its *.php files —
     * and everything under it, if it exists at all. The one place this
     * removal logic lives; both `apc build --clean` (delete then
     * regenerate) and `apc clean` (delete, full stop) call this instead
     * of each keeping their own copy.
     *
     * @return bool whether anything was actually removed
     */
    public static function wipeRunnerDirectory(string $basePath): bool
    {
        $runnerPath = "$basePath/runner";

        if (!is_dir($runnerPath)) {
            return false;
        }

        self::removeDirectoryRecursive($runnerPath);

        return true;
    }

    private static function removeDirectoryRecursive(string $path): void
    {
        foreach (scandir($path) ?: [] as $entry) {
            if ($entry === '.' || $entry === '..') {
                continue;
            }

            $sub = "$path/$entry";

            is_dir($sub) ? self::removeDirectoryRecursive($sub) : unlink($sub);
        }

        rmdir($path);
    }

    /** @return list<array> */
    private static function compileAll(): array
    {
        $compiled = [];

        foreach (self::modules() as $module) {
            foreach ($module->controllers() as $controllerClass) {
                $compiled = [...$compiled, ...RouteCompiler::compile($controllerClass, $module->prefix())];
            }
        }

        return $compiled;
    }

    /**
     * Best-effort — caching is a pure optimization, never a correctness
     * requirement, so a read-only filesystem or missing directory just
     * means routes() falls back to compiling fresh every request instead
     * of failing the request outright.
     *
     * @param list<array> $compiled
     */
    private static function writeCache(string $path, array $compiled): void
    {
        $directory = dirname($path);

        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            return;
        }

        if (!is_writable($directory)) {
            return;
        }

        $exported = var_export($compiled, true);

        file_put_contents($path, "<?php\n\n// Auto-generated by Gerogo\\Runner::routes() — delete to force a rebuild.\nreturn $exported;\n");
    }

    /**
     * Only for tests: forces the next boot() to redo the work instead of
     * being a no-op. Never call this from application code.
     */
    public static function reset(): void
    {
        self::$config = null;
        self::$modules = null;
        self::$routes = null;
    }

    private static function loadEnvFile(string $path): void
    {
        foreach (self::parseEnvFile($path) as $key => $value) {
            $_ENV[$key] ??= $value;
        }
    }

    /**
     * Which .env file a flavour actually means — the one place this
     * app's env-file naming convention lives: always .env.<flavour>,
     * spelled out in full (.env.local, .env.production, .env.staging, or
     * .env.<anything else> a real APP_ENV happens to carry).
     */
    public static function envFilePath(string $basePath, string $flavour): string
    {
        return "$basePath/.env.$flavour";
    }

    /** @return array<string, string> */
    private static function parseEnvFile(string $path): array
    {
        if (!is_file($path)) {
            return [];
        }

        $values = [];

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
                continue;
            }

            [$key, $value] = explode('=', $line, 2);
            $values[trim($key)] = trim($value, " \t\"'");
        }

        return $values;
    }
}
