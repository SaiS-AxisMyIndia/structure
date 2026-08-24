<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;

/**
 * `apc service:stop <service> [--<stage>]` — stops ONE named
 * microservice, wherever it's running (a different terminal, a
 * background process — it doesn't need to be this process's child; see
 * ServiceProcess::stop()). The single-service counterpart to
 * `apc stop --<service>` (StopCommand) and `apc stop --<stage>
 * --<svc1> --<svc2>` (MultiStopCommand) — same pidfile key, same
 * mechanism, just addressed the `service:*` way: `apc service:stop
 * auth` instead of `apc stop --auth`.
 */
final class ServiceStopCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $name = $args[0] ?? null;

        if ($name === null) {
            fwrite(STDERR, "Usage: apc service:stop <service> [--<stage>]\n");

            return 1;
        }

        $stage = Runner::get('env', 'local');
        $key = ServiceProcess::key($stage, $name);

        if (ServiceProcess::stop($this->basePath, $key)) {
            printf("Stopped %s (--%s).\n", $name, $stage);

            return 0;
        }

        fwrite(STDERR, "$name isn't running (no active $key.pid).\n");

        return 1;
    }
}
