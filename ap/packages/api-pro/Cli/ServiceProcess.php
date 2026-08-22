<?php

declare(strict_types=1);

namespace ApiPro\Cli;

/**
 * One spawned `php -S` server process, tracked well enough that a LATER,
 * completely separate `apc stop` invocation — a different terminal, a
 * deploy script, anything else on this machine — can find and stop it.
 * Shared by StartCommand (exactly one) and MultiStartCommand (one or
 * more) for spawning + supervising, and by StopCommand/MultiStopCommand
 * for stopping — the same key format is what ties all four together.
 */
final class ServiceProcess
{
    /**
     * The identifier a pidfile is named after — <service>.<stage> for a
     * named service, or just <stage> for the flat/default case. Start
     * and stop each compute this independently, from the same (stage,
     * service) pair — that's the whole mechanism that lets `apc stop`
     * find a server `apc start` began in a completely different process.
     */
    public static function key(string $stage, ?string $service): string
    {
        return $service !== null ? "$service.$stage" : $stage;
    }

    public static function pidFilePath(string $basePath, string $key): string
    {
        return "$basePath/storage/pids/$key.pid";
    }

    /**
     * Spawns `php -S $address -t $basePath`, with APP_ENV=$stage (and
     * APC_SERVICE=$service, when given) set in the CHILD's OWN process
     * environment only — this process's $_ENV stays untouched. That's
     * what makes the child's own runner/runner.php → Runner::boot()
     * (called with no explicit args, same as any real request) resolve
     * the right .env file on its very first request, via the exact same
     * "real env var" fallback Runner::boot() already has — zero new
     * bootstrap logic needed there.
     *
     * Writes the pidfile immediately, before returning — a process
     * that's running but has no pidfile yet is worse than one that
     * briefly has a pidfile for a process about to fail to bind.
     *
     * @return array{process: resource, out: resource, err: resource, key: string}|null null if proc_open() itself failed
     */
    public static function spawn(string $basePath, string $key, string $address, string $stage, ?string $service): ?array
    {
        $command = sprintf(
            '%s -S %s -t %s',
            escapeshellarg(PHP_BINARY),
            escapeshellarg($address),
            escapeshellarg($basePath),
        );

        $env = [...getenv(), 'APP_ENV' => $stage];

        if ($service !== null) {
            $env['APC_SERVICE'] = $service;
        }

        $process = proc_open($command, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $basePath, $env);

        if (!is_resource($process)) {
            return null;
        }

        fclose($pipes[0]);
        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);

        $status = proc_get_status($process);
        self::writePidFile($basePath, $key, $status['pid']);

        return ['process' => $process, 'out' => $pipes[1], 'err' => $pipes[2], 'key' => $key];
    }

    /**
     * Reads <key>.pid and sends SIGTERM to that PID, if it's still
     * actually running — posix_kill($pid, 0) as an existence probe
     * first, so a stale pidfile left over from a crash doesn't report
     * false success, or worse, signal whatever unrelated process has
     * since reused that PID. The pidfile is removed either way.
     */
    public static function stop(string $basePath, string $key): bool
    {
        $path = self::pidFilePath($basePath, $key);

        if (!is_file($path)) {
            return false;
        }

        $pid = (int) trim((string) file_get_contents($path));
        $alive = $pid > 0 && posix_kill($pid, 0);

        if ($alive) {
            posix_kill($pid, SIGTERM);
        }

        unlink($path);

        return $alive;
    }

    /**
     * Blocks until Ctrl+C (or a SIGTERM from `apc stop`), relaying every
     * child's stdout/stderr to this terminal tagged by name, then
     * terminates whatever's still running and cleans up every pidfile.
     *
     * @param array<string, array{process: resource, out: resource, err: resource, key: string}> $children
     */
    public static function superviseUntilInterrupted(string $basePath, array $children): int
    {
        $running = true;
        $stop = static function () use (&$running): void {
            $running = false;
        };

        pcntl_async_signals(true);
        pcntl_signal(SIGINT, $stop);
        pcntl_signal(SIGTERM, $stop);

        while ($running && $children !== []) {
            foreach ($children as $name => $child) {
                self::relay($name, $child['out']);
                self::relay($name, $child['err']);

                $status = proc_get_status($child['process']);

                if (!$status['running']) {
                    // One last drain — the process may have written its
                    // final lines between the relay() calls above and
                    // proc_get_status() catching the exit.
                    self::relay($name, $child['out']);
                    self::relay($name, $child['err']);
                    printf("  ! %s exited (code %d)\n", $name, $status['exitcode']);
                    fclose($child['out']);
                    fclose($child['err']);
                    proc_close($child['process']);
                    @unlink(self::pidFilePath($basePath, $child['key']));
                    unset($children[$name]);
                }
            }

            if ($children !== []) {
                usleep(200_000);
            }
        }

        if ($children === []) {
            fwrite(STDERR, "Every service exited on its own.\n");

            return 1;
        }

        echo "\nStopping...\n";

        foreach ($children as $name => $child) {
            proc_terminate($child['process'], SIGTERM);
            self::relay($name, $child['out']);
            self::relay($name, $child['err']);
            fclose($child['out']);
            fclose($child['err']);
            proc_close($child['process']);
            @unlink(self::pidFilePath($basePath, $child['key']));
            printf("  ✓ %s stopped\n", $name);
        }

        return 0;
    }

    /** @param resource $pipe */
    private static function relay(string $name, $pipe): void
    {
        $chunk = fread($pipe, 8192);

        if ($chunk === false || $chunk === '') {
            return;
        }

        foreach (explode("\n", rtrim($chunk, "\n")) as $line) {
            printf("[%s] %s\n", $name, $line);
        }
    }

    private static function writePidFile(string $basePath, string $key, int $pid): void
    {
        $dir = "$basePath/storage/pids";

        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        file_put_contents(self::pidFilePath($basePath, $key), (string) $pid);
    }
}
