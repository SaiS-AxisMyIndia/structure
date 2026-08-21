<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;
use Throwable;

/**
 * `apc start [host:port]` — always prepares a clean build first (the same
 * as `apc build --clean` followed by `apc build`, so the server never
 * serves a stale route table left over from an earlier run), then starts
 * PHP's built-in web server bound to that address in the foreground.
 *
 * Default address is 127.0.0.1:7070. `apc start 8081` is shorthand for
 * `apc start 127.0.0.1:8081`.
 */
final class StartCommand implements Command
{
    private const DEFAULT_ADDRESS = '127.0.0.1:7070';

    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        Runner::clearRoutesCache();

        try {
            $routes = Runner::warmRoutes();
        } catch (Throwable $e) {
            fwrite(STDERR, 'Build failed: ' . $e->getMessage() . "\n");

            return 1;
        }

        printf("Build: resolved %d module(s), compiled %d route(s).\n", count(Runner::modules()), count($routes));

        $address = $this->normalizeAddress($args[0] ?? self::DEFAULT_ADDRESS);

        printf("Starting PHP server at http://%s (Ctrl+C to stop)...\n", $address);

        $command = sprintf(
            '%s -S %s -t %s',
            escapeshellarg(PHP_BINARY),
            escapeshellarg($address),
            escapeshellarg($this->basePath),
        );

        // Foreground, inheriting this process's stdio, so the server's
        // request log streams live and Ctrl+C stops it directly.
        passthru($command, $exitCode);

        return $exitCode;
    }

    private function normalizeAddress(string $address): string
    {
        // A bare port ("8081") is shorthand for "127.0.0.1:8081".
        return ctype_digit($address) ? '127.0.0.1:' . $address : $address;
    }
}
