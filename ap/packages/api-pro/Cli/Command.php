<?php

declare(strict_types=1);

namespace ApiPro\Cli;

/** One `apc` subcommand. Runner::boot() has already run by the time run() is called. */
interface Command
{
    /**
     * @param list<string> $args arguments after the command name (e.g. ['pro-sql', '1.0.0'] for `apc install pro-sql 1.0.0`)
     * @return int process exit code — 0 on success, non-zero on failure
     */
    public function run(array $args): int;
}
