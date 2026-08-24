<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;
use Throwable;

/**
 * `apc build` — the deploy-time build step. Every run regenerates every
 * runner/<name>.php file IN PLACE from each module's own
 * Module::runnerTemplate() (runner/controllers.php and
 * runner/entities.php in particular come back from real filesystem
 * discovery — see App\Application::runnerTemplate() /
 * ApiPro\ClassDiscovery — not a blank stub), then force-compiles every
 * module's routes and writes storage/routes.cache.php, regardless of
 * `env` (unlike Runner::routes(), which only caches outside `env:
 * local`), then runs every module's own build() hook (e.g. pro-sql's
 * entity-table sync). The same idea as `npm run build` or Laravel's
 * `route:cache`: do the expensive work once, ahead of traffic, instead
 * of making the first real request pay for it. Every step prints its own
 * "... done" line as it finishes.
 *
 * `apc build -c|--clean` does the exact same thing, except the whole
 * runner/ directory is deleted first — nothing hand-edited (or left
 * over from a partially-wiped directory) survives; only what actually
 * gets regenerated does. Safe even if runner/ is entirely missing to
 * start with.
 *
 * `--local`/`--production` (or a real APP_ENV process env var, else
 * 'local') pick which .env.<env> file this build boots from — resolved
 * once, up front, by the `apc` script itself before Runner::boot() ever
 * runs; see that script's own comment for why it has to happen there.
 */
final class BuildCommand implements Command
{
    /** Owned here, not by any Module — this is the framework's own boot glue, not any particular module's config. */
    private const RUNNER_BOOTSTRAP_TEMPLATE = <<<'PHP'
        <?php

        declare(strict_types=1);

        // The configuration set for running — the one file that loads
        // .env.<env>, resolves modules, compiles routes, and hands back
        // the fully resolved config. Nothing else should load .env.<env>,
        // require app.php, or read runner/*.php directly — everything
        // downstream asks Runner for it.

        $basePath = dirname(__DIR__);
        require_once "$basePath/vendor/autoload.php";

        use ApiPro\Runner;

        Runner::boot($basePath);

        return Runner::config();

        PHP;

    public function __construct(private readonly string $basePath)
    {
    }

    /**
     * Runs a full build (writeRunnerFiles() + warmRoutes() + every
     * module's own build() hook) ONLY if runner/ doesn't exist at all —
     * a fresh checkout, or one `apc clean` just wiped. `apc start`
     * (StartCommand) and `apc start --<svc1> --<svc2> ...`
     * (MultiStartCommand) both call this before spawning anything:
     * Runner::boot() tolerates a missing runner/<name>.php by
     * degrading that config key to [] rather than fataling (see its
     * own comment for why) — which means, without this check, `apc
     * start` against a missing runner/ would report success while
     * every module's controllers()/entities()/etc. silently resolved
     * to nothing.
     *
     * Boots Runner itself if it hasn't booted yet — build() below
     * needs Runner::get('env')/('service') to already resolve to
     * something. That matters for MultiStartCommand specifically: its
     * orchestrator process deliberately never boots Runner on its own
     * (see that class's own comment), since it's never the thing
     * actually serving a request. $stage is that same orchestrator's
     * already-resolved --<stage>; harmless to pass even when Runner
     * has already booted (boot() is a no-op the second time).
     *
     * @return bool false (after printing to STDERR) if the build itself failed
     */
    public static function ensureBuilt(string $basePath, ?string $stage = null): bool
    {
        if (is_dir("$basePath/runner")) {
            return true;
        }

        Runner::boot($basePath, $stage);

        echo "runner/ not found — building first (apc build)...\n";

        return (new self($basePath))->run([]) === 0;
    }

    public function run(array $args): int
    {
        foreach ($args as $arg) {
            // --local/--production are consumed by the `apc` script
            // itself, before Runner::boot() ever ran — accepted (and
            // ignored) here too so `apc build --clean --production`
            // doesn't get rejected as an unknown flag by this check.
            if (!in_array($arg, ['-c', '--clean', '--local', '--production'], true)) {
                fwrite(STDERR, "Usage: apc build [-c|--clean] [--local|--production]\n");

                return 1;
            }
        }

        $clean = in_array('-c', $args, true) || in_array('--clean', $args, true);

        if ($clean) {
            $this->wipeRunnerDirectory();
        }

        return $this->build();
    }

    private function build(): int
    {
        printf("Env: %s\n", Runner::get('env', 'local'));

        $errors = $this->writeRunnerFiles();

        // Runner::boot() already ran once — by the `apc` script, before
        // this command's args were even parsed — using whatever runner/
        // looked like at that moment (possibly wiped, possibly stale).
        // The files just written need Runner's cached config/module list
        // thrown away and reloaded from what's on disk now, or
        // warmRoutes()/modules()/build() below would keep building
        // against the OLD config. Runner::get('env')/('service') carry
        // the already-resolved --<stage>/--<service> choice through, so
        // this reboot doesn't silently fall back to the flat/default app.
        $stage = Runner::get('env');
        $service = Runner::get('service');
        Runner::reset();
        Runner::boot($this->basePath, $stage, $service);

        try {
            $routes = Runner::warmRoutes();
        } catch (Throwable $e) {
            fwrite(STDERR, 'Build failed: ' . $e->getMessage() . "\n");

            return 1;
        }

        printf("Routes: resolved %d module(s), compiled %d route(s). done\n", count(Runner::modules()), count($routes));
        printf("Cache: %s done\n", Runner::routesCachePath());

        // Each module's own build() (e.g. pro-sql's entity-table sync) —
        // a no-op for any module that hasn't overridden it. One module
        // failing here doesn't fail the whole build; routes are already
        // compiled and cached by this point regardless.
        foreach (Runner::modules() as $module) {
            try {
                $summary = $module->build();
            } catch (Throwable $e) {
                $errors[] = sprintf('%s::build() failed: %s', $module::class, $e->getMessage());

                continue;
            }

            if ($summary !== null) {
                echo $summary . " done\n";
            }
        }

        foreach ($errors as $error) {
            fwrite(STDERR, "  ! $error\n");
        }

        return $errors === [] ? 0 : 1;
    }

    /**
     * Writes every runner/<name>.php file — this command's own
     * runner.php bootstrap template plus every module's own
     * Module::runnerTemplate() — into the runner/ directory, creating it
     * first if `--clean` (or a first-ever build) left it missing.
     * Overwrites in place; never deletes anything itself (wipeRunnerDirectory()
     * is the only thing that does that, and only when --clean asked for it).
     *
     * @return list<string> error messages, if any module's runnerTemplate() threw
     */
    private function writeRunnerFiles(): array
    {
        $templates = ['runner.php' => self::RUNNER_BOOTSTRAP_TEMPLATE];
        $errors = [];

        // Runner::modules() only constructs each Module — it doesn't
        // call register() (that's Kernel's job, during real request/
        // container-building work) — so this runs fine even with every
        // runner/*.php config degraded to [] (see Runner::boot()'s own
        // tolerance for a missing file), which is exactly the state this
        // command needs to work in to be able to fix it.
        foreach (Runner::modules() as $module) {
            try {
                foreach ($module->runnerTemplate() as $filename => $content) {
                    $templates[$filename] = $content;
                }
            } catch (Throwable $e) {
                $errors[] = sprintf('%s::runnerTemplate() failed: %s', $module::class, $e->getMessage());
            }
        }

        $runnerPath = "$this->basePath/runner";

        if (!is_dir($runnerPath) && !mkdir($runnerPath, 0775, true) && !is_dir($runnerPath)) {
            fwrite(STDERR, "Could not create $runnerPath\n");
            $errors[] = "Could not create $runnerPath";

            return $errors;
        }

        foreach ($templates as $filename => $content) {
            file_put_contents("$runnerPath/$filename", $content);
            echo "runner/$filename done\n";
        }

        return $errors;
    }

    /** `--clean` only: deletes the whole runner/ directory, not just its *.php files. */
    private function wipeRunnerDirectory(): void
    {
        if (Runner::wipeRunnerDirectory($this->basePath)) {
            printf("Removed %s/runner\n", $this->basePath);
        }
    }
}
