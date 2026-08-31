<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;

/**
 * `apc stop [-f|--flavour <name>]` — stops the ONE server that a matching
 * `apc start` (same flavour) launched, wherever it's running (a
 * different terminal, a background process, another deploy step
 * entirely) — it doesn't need to be this process's child.
 * `Runner::get('env')` here is exactly what StartCommand used to name
 * that same flavour's pidfile (see AppProcess::pidFilePath()).
 */
final class StopCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $flavour = Runner::get('env', 'local');

        if (AppProcess::stop($this->basePath, $flavour)) {
            printf("Stopped %s.\n", $flavour);

            return 0;
        }

        fwrite(STDERR, sprintf("%s isn't running (no active %s.pid).\n", $flavour, $flavour));

        return 1;
    }
}
