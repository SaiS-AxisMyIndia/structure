<?php

declare(strict_types=1);

namespace ApiPro\Cli;

use ApiPro\Runner;

/**
 * `apc service:logs <service> [--lines=N] [--no-follow] [--<stage>]` —
 * reads back storage/logs/<service>.<stage>.log, the file
 * ServiceProcess::spawnDetached() appends a service's stdout/stderr to
 * (see ServiceProcess::logFilePath()). Prints the last N lines (50 by
 * default, `--lines=0` for none) then, unless `--no-follow` is given,
 * keeps the terminal open streaming new lines as they're written — the
 * same shape as `docker compose logs -f <service>` or `tail -f` —
 * until Ctrl+C.
 *
 * Only reads a file `apc service:start` already created; it never
 * starts, stops, or otherwise touches the service itself.
 */
final class ServiceLogsCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        $name = null;
        $lines = 50;
        $follow = true;

        foreach ($args as $arg) {
            if (str_starts_with($arg, '--lines=')) {
                $lines = max(0, (int) substr($arg, strlen('--lines=')));
            } elseif ($arg === '--no-follow') {
                $follow = false;
            } elseif (!str_starts_with($arg, '--')) {
                $name ??= $arg;
            }
        }

        if ($name === null) {
            fwrite(STDERR, "Usage: apc service:logs <service> [--lines=N] [--no-follow] [--<stage>]\n");

            return 1;
        }

        $stage = Runner::get('env', 'local');
        $key = ServiceProcess::key($stage, $name);
        $logPath = ServiceProcess::logFilePath($this->basePath, $key);

        if (!is_file($logPath)) {
            fwrite(STDERR, "No logs yet for $name (--$stage) — has it been started with 'apc service:start'?\n");

            return 1;
        }

        echo implode('', self::tail($logPath, $lines));

        return $follow ? self::follow($logPath) : 0;
    }

    /** @return list<string> */
    private static function tail(string $path, int $lines): array
    {
        if ($lines === 0) {
            return [];
        }

        return array_slice(file($path) ?: [], -$lines);
    }

    /** Blocks, echoing newly appended bytes, until Ctrl+C (SIGINT). */
    private static function follow(string $path): int
    {
        $handle = fopen($path, 'r');

        if ($handle === false) {
            return 1;
        }

        fseek($handle, 0, SEEK_END);

        $running = true;
        pcntl_async_signals(true);
        pcntl_signal(SIGINT, static function () use (&$running): void {
            $running = false;
        });

        while ($running) {
            $chunk = fread($handle, 8192);

            if ($chunk === false || $chunk === '') {
                usleep(300_000);
                clearstatcache(false, $path);

                continue;
            }

            echo $chunk;
        }

        fclose($handle);

        return 0;
    }
}
