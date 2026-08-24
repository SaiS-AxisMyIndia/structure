<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;

/**
 * `apc start --<stage> --<service1> --<service2> ...` — one PHP
 * built-in server PER named service, each a genuinely separate process
 * booting its OWN .env.<service>.<stage-abbreviation> (own DB_*, own
 * SESSION_*, own PORT — see Runner::peekEnv()/Runner::envFilePath()),
 * running concurrently until Ctrl+C (or `apc stop`) stops them together.
 * This is the multi-service form; a single --<service> (or none at all)
 * stays the plain StartCommand path — see the `apc` script's own
 * dispatch for where that split happens (that same dispatch also
 * expands a bare `--all` flag into every named service configured for
 * $stage — see Runner::namedServices() — before it ever reaches here).
 *
 * Calls BuildCommand::ensureBuilt() once, up front, before spawning
 * anything — runner/ is shared by every service that's about to start,
 * so it only needs checking/building once regardless of how many
 * $serviceNames there are.
 */
final class MultiStartCommand
{
    public function __construct(private readonly string $basePath)
    {
    }

    /** @param list<string> $serviceNames */
    public function run(string $stage, array $serviceNames): int
    {
        if (!BuildCommand::ensureBuilt($this->basePath, $stage)) {
            fwrite(STDERR, "Build failed — aborting start.\n");

            return 1;
        }

        /** @var array<string, array{process: resource, out: resource, err: resource, key: string}> $children */
        $children = [];

        foreach ($serviceNames as $name) {
            $envFile = Runner::envFilePath($this->basePath, $stage, $name);
            $env = Runner::peekEnv($this->basePath, $stage, $name);
            $port = $env['PORT'] ?? null;

            if ($port === null) {
                fwrite(STDERR, "  ✗ $name: no PORT set in " . basename($envFile) . " — skipped\n");

                continue;
            }

            $key = ServiceProcess::key($stage, $name);
            $existingPid = ServiceProcess::runningPid($this->basePath, $key);

            if ($existingPid !== null) {
                // See StartCommand's own comment on this same check —
                // spawn() would otherwise clobber $key's pidfile with
                // this new (redundant) child's PID, then delete it
                // outright once that child dies for failing to bind
                // the already-taken port, losing track of the
                // still-running original entirely.
                fwrite(STDERR, "  ✗ $name: already running (pid $existingPid) — skipped\n");

                continue;
            }

            $address = "127.0.0.1:$port";
            $label = $env['SERVICE'] ?? $name;
            $child = ServiceProcess::spawn($this->basePath, $key, $address, $stage, $name);

            if ($child === null) {
                fwrite(STDERR, "  ✗ $name: failed to start\n");

                continue;
            }

            printf("  ✓ %-12s (%s) -> http://%s\n", $label, basename($envFile), $address);
            flush();
            $children[$name] = $child;
        }

        if ($children === []) {
            fwrite(STDERR, "No services started.\n");

            return 1;
        }

        echo "\nAll services running. Ctrl+C to stop everything.\n";
        flush();

        return ServiceProcess::superviseUntilInterrupted($this->basePath, $children);
    }
}
