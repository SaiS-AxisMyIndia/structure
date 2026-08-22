<?php

declare(strict_types=1);

namespace ApiPro\Cli;

/**
 * `apc stop --<stage> --<service1> --<service2> ...` — stops several
 * named services at once, the multi-service counterpart to
 * MultiStartCommand. Each name's pidfile key (see ServiceProcess::key())
 * is computed the exact same way `apc start` computed it when that
 * service was launched — this process never needs to have started
 * them itself, or even be the same terminal.
 */
final class MultiStopCommand
{
    public function __construct(private readonly string $basePath)
    {
    }

    /** @param list<string> $serviceNames */
    public function run(string $stage, array $serviceNames): int
    {
        $ok = true;

        foreach ($serviceNames as $name) {
            $key = ServiceProcess::key($stage, $name);

            if (ServiceProcess::stop($this->basePath, $key)) {
                printf("  ✓ %s stopped\n", $name);
            } else {
                fwrite(STDERR, "  ✗ $name isn't running\n");
                $ok = false;
            }
        }

        return $ok ? 0 : 1;
    }
}
