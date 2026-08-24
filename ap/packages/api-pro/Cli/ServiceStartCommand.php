<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;

/**
 * `apc service:start <service> [--<stage>]` — starts ONE named
 * microservice detached, in the background, and returns immediately;
 * the opposite of `apc start --<service>` (StartCommand), which blocks
 * in the foreground until Ctrl+C. Meant for the same kind of everyday
 * use as `docker compose start <service>` — bring one service up
 * without occupying a terminal, then check on it later with
 * `apc service:list`/`apc service:logs`.
 *
 * Reads the exact same .env.<service>.<stage-abbreviation> file
 * StartCommand/MultiStartCommand read (see Runner::envFilePath()) for
 * its PORT/SERVICE — this is a different way of STARTING a service,
 * not a different place to configure one. Refuses to double-start a
 * service that's already running (see ServiceProcess::runningPid()).
 */
final class ServiceStartCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $name = $args[0] ?? null;

        if ($name === null) {
            fwrite(STDERR, "Usage: apc service:start <service> [--<stage>]\n");

            return 1;
        }

        if (!BuildCommand::ensureBuilt($this->basePath)) {
            fwrite(STDERR, "Build failed — aborting start.\n");

            return 1;
        }

        $stage = Runner::get('env', 'local');
        $key = ServiceProcess::key($stage, $name);

        if (ServiceProcess::runningPid($this->basePath, $key) !== null) {
            fwrite(STDERR, "$name is already running (--$stage) — see 'apc service:list'.\n");

            return 1;
        }

        $envFile = Runner::envFilePath($this->basePath, $stage, $name);
        $env = Runner::peekEnv($this->basePath, $stage, $name);
        $port = $env['PORT'] ?? null;

        if ($port === null) {
            fwrite(STDERR, "$name: no PORT set in " . basename($envFile) . ".\n");

            return 1;
        }

        $address = "127.0.0.1:$port";
        $label = $env['SERVICE'] ?? $name;
        $logPath = ServiceProcess::logFilePath($this->basePath, $key);
        $pid = ServiceProcess::spawnDetached($this->basePath, $key, $address, $stage, $name, $logPath);

        if ($pid === null) {
            fwrite(STDERR, "$name: failed to start.\n");

            return 1;
        }

        printf("Started %s (%s) -> http://%s [pid %d]\n", $label, basename($envFile), $address, $pid);
        printf("Logs: apc service:logs %s\n", $name);

        return 0;
    }
}
