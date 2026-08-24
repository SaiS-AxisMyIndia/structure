<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;
use Throwable;

/**
 * `apc start [host:port] [--<stage>] [--<service>]` — first makes sure
 * runner/ actually exists at all (BuildCommand::ensureBuilt(): a full
 * `apc build` if it's missing entirely — a fresh checkout, or one
 * `apc clean` just wiped — a no-op otherwise), then always refreshes
 * just the route cache (clearRoutesCache() + warmRoutes() — the same
 * pair `apc build` itself calls, minus the runner/*.php regeneration
 * step, so the server never serves a stale route table left over from
 * an earlier run without paying for a full rebuild on every single
 * start), then starts PHP's built-in web server bound to that address
 * in the foreground — printing the /tester and/or /app-viewer URL
 * too, whichever of the two is enabled.
 *
 * Default address is 127.0.0.1:<PORT in .env.<env>>, or 127.0.0.1:7070
 * if that env has none. `apc start 8081` is shorthand for
 * `apc start 127.0.0.1:8081`. --<stage>/--<service> are resolved by the
 * `apc` script itself, before Runner::boot() ever runs (see its own
 * comment) — stripped here purely so they aren't mistaken for the
 * host:port positional argument. More than one --<service> is a
 * different command entirely — see MultiStartCommand.
 *
 * No --<service> at all means the flat/default app — guarded by
 * DEFAULT_SERVICE in .env.<stage>: set that to false once a stage is
 * meant to run ONLY as named services, never as the undifferentiated
 * whole app, and this refuses to start instead of silently doing it
 * anyway.
 */
final class StartCommand implements Command
{
    /** Also read by VersionCommand, to show where /tester and /app-viewer would be. */
    public static function defaultAddress(): string
    {
        return '127.0.0.1:' . Runner::env('PORT', '7070');
    }

    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $args = array_values(array_filter($args, static fn (string $arg): bool => !str_starts_with($arg, '--')));

        $stage = Runner::get('env', 'local');
        $service = Runner::get('service');

        if ($service === null && !filter_var(Runner::env('DEFAULT_SERVICE', true), FILTER_VALIDATE_BOOLEAN)) {
            fwrite(STDERR, sprintf(
                "\"%s\" has DEFAULT_SERVICE=false in .env.%s — it can't be started as the default/standalone app.\n"
                    . "Start a named service instead: apc start --%s --<service>.\n",
                $stage,
                $stage,
                $stage,
            ));

            return 1;
        }

        if (!BuildCommand::ensureBuilt($this->basePath)) {
            fwrite(STDERR, "Build failed — aborting start.\n");

            return 1;
        }

        Runner::clearRoutesCache();

        try {
            $routes = Runner::warmRoutes();
        } catch (Throwable $e) {
            fwrite(STDERR, 'Build failed: ' . $e->getMessage() . "\n");

            return 1;
        }

        printf("Build: resolved %d module(s), compiled %d route(s).\n", count(Runner::modules()), count($routes));

        $address = $this->normalizeAddress($args[0] ?? self::defaultAddress());
        $label = Runner::env('SERVICE', 'PHP server');

        printf("Starting %s at http://%s (Ctrl+C to stop)...\n", $label, $address);

        // The real bind address, not a guessed default — unlike
        // VersionCommand (which has no live server to ask), this command
        // is the one actually about to serve it.
        if (Runner::get('tester')['enabled'] ?? false) {
            echo "  Tester:     http://$address/tester\n";
        }

        if (Runner::get('app_viewer')['enabled'] ?? false) {
            echo "  App Viewer: http://$address/app-viewer\n";
        }

        $key = ServiceProcess::key($stage, $service);
        $existingPid = ServiceProcess::runningPid($this->basePath, $key);

        if ($existingPid !== null) {
            // spawn() writes $key's pidfile unconditionally, the moment
            // its child process exists — it has no way to know a PID
            // already sitting in that file belongs to a still-live
            // server rather than a stale one. Left unchecked, a second
            // `apc start` for the same (stage, service) would overwrite
            // that pidfile with its own (likely doomed to fail — the
            // port's already taken) child's PID, and then delete it
            // entirely once that child dies for failing to bind —
            // leaving the FIRST, still-running server with no pidfile
            // at all, and `apc stop` unable to find it ever again.
            fwrite(STDERR, sprintf(
                "%s is already running (--%s, pid %d) — stop it first with `apc stop`.\n",
                $service ?? $stage,
                $stage,
                $existingPid,
            ));

            return 1;
        }

        $child = ServiceProcess::spawn($this->basePath, $key, $address, $stage, $service);

        if ($child === null) {
            fwrite(STDERR, "Failed to start.\n");

            return 1;
        }

        return ServiceProcess::superviseUntilInterrupted($this->basePath, [$key => $child]);
    }

    private function normalizeAddress(string $address): string
    {
        // A bare port ("8081") is shorthand for "127.0.0.1:8081".
        return ctype_digit($address) ? '127.0.0.1:' . $address : $address;
    }
}
