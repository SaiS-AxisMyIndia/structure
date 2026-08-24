<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;

/**
 * `apc service:list [--<stage>]` — every named microservice configured
 * for a stage (a .env.<service>.<stage-abbreviation> file sitting next
 * to app.php — see Runner::envFilePath()), each with whether it's
 * currently running (see ServiceProcess::runningPid()) and, if so, on
 * which pid/port. This is discovery, not action — it never starts,
 * stops, or otherwise touches anything.
 *
 * The flat/default app (no --<service>, plain .env.<stage>) isn't a
 * "named service" in this sense and doesn't appear here — see `apc
 * start`/`apc stop` for that one.
 */
final class ServiceListCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $stage = Runner::get('env', 'local');
        $names = Runner::namedServices($this->basePath, $stage);

        if ($names === []) {
            printf(
                "No named services configured for --%s (no %s/.env.<service>.%s file found).\n",
                $stage,
                basename($this->basePath),
                Runner::stageAbbreviation($stage),
            );

            return 0;
        }

        printf("%-16s %-12s %-8s %-8s %s\n", 'SERVICE', 'STAGE', 'STATUS', 'PID', 'PORT');

        foreach ($names as $name) {
            $env = Runner::peekEnv($this->basePath, $stage, $name);
            $pid = ServiceProcess::runningPid($this->basePath, ServiceProcess::key($stage, $name));

            printf(
                "%-16s %-12s %-8s %-8s %s\n",
                $env['SERVICE'] ?? $name,
                $stage,
                $pid !== null ? 'running' : 'stopped',
                $pid ?? '-',
                $env['PORT'] ?? '-',
            );
        }

        return 0;
    }
}
