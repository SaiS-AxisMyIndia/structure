<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;

/**
 * `apc stop [--<stage>] [--<service>]` — stops the ONE server that a
 * matching `apc start` (same stage, same service, or lack of one)
 * launched, wherever it's running (a different terminal, a background
 * process, another deploy step entirely) — it doesn't need to be this
 * process's child. `Runner::get('service')` here is exactly what
 * StartCommand used to build the SAME pidfile key when it started that
 * service (see ServiceProcess::key()); with no --<service> flag either
 * (the flat/default case), it's null on both ends, and the key is just
 * the stage name.
 *
 * More than one --<service> flag is a different command — see
 * MultiStopCommand (dispatched directly by the `apc` script, the same
 * split `start`/MultiStartCommand already makes).
 */
final class StopCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $stage = Runner::get('env', 'local');
        $service = Runner::get('service');
        $key = ServiceProcess::key($stage, $service);

        if (ServiceProcess::stop($this->basePath, $key)) {
            printf("Stopped %s.\n", $service ?? $stage);

            return 0;
        }

        fwrite(STDERR, sprintf("%s isn't running (no active %s.pid).\n", $service ?? $stage, $key));

        return 1;
    }
}
