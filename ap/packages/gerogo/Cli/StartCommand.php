<?php

declare(strict_types=1);

namespace Gerogo\Cli;

use Gerogo\Runner;
use Throwable;

/**
 * `apc start [host:port] [-f|--flavour <name>]` — first makes sure
 * runner/ actually exists at all (BuildCommand::ensureBuilt(): a full
 * `apc build` if it's missing entirely — a fresh checkout, or one
 * `apc clean` just wiped — a no-op otherwise), then always refreshes
 * just the route cache (clearRoutesCache() + warmRoutes() — the same
 * pair `apc build` itself calls, minus the runner/*.php regeneration
 * step, so the server never serves a stale route table left over from
 * an earlier run without paying for a full rebuild on every single
 * start), then starts PHP's built-in web server bound to that address
 * in the foreground — printing an identity banner (name/version/env/
 * port/db target — no secrets) and the /tester and/or /app-viewer URL
 * too, whichever of the two is enabled.
 *
 * Default address is 127.0.0.1:<PORT in .env.<flavour>>, or
 * 127.0.0.1:7070 if that flavour has none. `apc start 8081` is shorthand
 * for `apc start 127.0.0.1:8081`. -f/--flavour is resolved by the `apc`
 * script itself, before Runner::boot() ever runs (see its own comment) —
 * $args here is already just the positional host:port, nothing else.
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
        $flavour = Runner::get('env', 'local');

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

        printf("\nBuild: resolved %d module(s), compiled %d route(s).\n", count(Runner::modules()), count($routes));

        $address = $this->normalizeAddress($args[0] ?? self::defaultAddress());
        $label = Runner::env('SERVICE', 'PHP server');
        $version = Runner::get('version', '0.0.0');
        $db = Runner::get('prosql');

        printf("\n  %s v%s\n", $label, $version);
        printf("  env:     %s\n", $flavour);
        printf("  port:    %s\n", substr($address, strrpos($address, ':') + 1));

        if ($db !== null) {
            printf("  db:      %s:%s/%s\n", $db['host'], $db['port'], $db['database']);
        }

        printf("\nStarting at http://%s (Ctrl+C to stop)...\n", $address);

        // The real bind address, not a guessed default — unlike
        // VersionCommand (which has no live server to ask), this command
        // is the one actually about to serve it.
        if (Runner::get('tester')['enabled'] ?? false) {
            echo "  Tester:     http://$address/tester\n";
        }

        if (Runner::get('app_viewer')['enabled'] ?? false) {
            echo "  App Viewer: http://$address/app-viewer\n";
        }

        echo "\n"; // added for space

        $existingPid = AppProcess::runningPid($this->basePath, $flavour);

        if ($existingPid !== null) {
            // spawn() writes $flavour's pidfile unconditionally, the
            // moment its child process exists — it has no way to know a
            // PID already sitting in that file belongs to a still-live
            // server rather than a stale one. Left unchecked, a second
            // `apc start` for the same flavour would overwrite that
            // pidfile with its own (likely doomed to fail — the port's
            // already taken) child's PID, and then delete it entirely
            // once that child dies for failing to bind — leaving the
            // FIRST, still-running server with no pidfile at all, and
            // `apc stop` unable to find it ever again.
            fwrite(STDERR, sprintf(
                "%s is already running (pid %d) — stop it first with `apc stop`.\n",
                $flavour,
                $existingPid,
            ));

            return 1;
        }

        $child = AppProcess::spawn($this->basePath, $flavour, $address);

        if ($child === null) {
            fwrite(STDERR, "Failed to start.\n");

            return 1;
        }

        return AppProcess::superviseUntilInterrupted($this->basePath, $child);
    }

    private function normalizeAddress(string $address): string
    {
        // A bare port ("8081") is shorthand for "127.0.0.1:8081".
        return ctype_digit($address) ? '127.0.0.1:' . $address : $address;
    }
}
