<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;

/**
 * `apc service:restart <service> [--<stage>]` — ServiceProcess::stop()
 * (if it was even running — a restart of a stopped service is just a
 * start, not an error) followed by the exact same start
 * ServiceStartCommand does. stop() itself waits (briefly) for the old
 * process to actually exit before returning, which is what keeps this
 * from racing the old process for its own port.
 */
final class ServiceRestartCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $name = $args[0] ?? null;

        if ($name === null) {
            fwrite(STDERR, "Usage: apc service:restart <service> [--<stage>]\n");

            return 1;
        }

        $stage = Runner::get('env', 'local');
        $key = ServiceProcess::key($stage, $name);

        if (ServiceProcess::stop($this->basePath, $key)) {
            printf("Stopped %s (--%s).\n", $name, $stage);
        }

        return (new ServiceStartCommand($this->basePath))->run($args);
    }
}
