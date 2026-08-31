<?php

declare(strict_types=1);

namespace ApiPro\Cli;

/**
 * One spawned `php -S` server process, tracked well enough that a LATER,
 * completely separate `apc stop` invocation — a different terminal, a
 * deploy script, anything else on this machine — can find and stop it.
 * Shared by StartCommand (spawning + supervising) and StopCommand
 * (stopping) — the same pidfile naming (by flavour) is what ties both
 * together.
 */
final class AppProcess
{
    public static function pidFilePath(string $basePath, string $flavour): string
    {
        return "$basePath/storage/pids/$flavour.pid";
    }

    /**
     * The pid a flavour's pidfile currently points at, IF that process is
     * still actually alive (posix_kill($pid, 0) as a pure existence
     * probe — no signal is delivered) — null otherwise, including "no
     * pidfile at all". A stale pidfile (process already gone) is
     * removed here rather than left behind, so `stop`/`start` never
     * have to reason about a pidfile that's lying.
     */
    public static function runningPid(string $basePath, string $flavour): ?int
    {
        $path = self::pidFilePath($basePath, $flavour);

        if (!is_file($path)) {
            return null;
        }

        $pid = (int) trim((string) file_get_contents($path));

        if ($pid > 0 && posix_kill($pid, 0)) {
            return $pid;
        }

        unlink($path);

        return null;
    }

    /**
     * Spawns `php -S $address -t $basePath`, with APP_ENV=$flavour set in
     * the CHILD's OWN process environment only — this process's $_ENV
     * stays untouched. That's what makes the child's own
     * runner/runner.php → Runner::boot() (called with no explicit args,
     * same as any real request) resolve the right .env file on its very
     * first request, via the exact same "real env var" fallback
     * Runner::boot() already has — zero new bootstrap logic needed there.
     *
     * Writes the pidfile immediately, before returning — a process
     * that's running but has no pidfile yet is worse than one that
     * briefly has a pidfile for a process about to fail to bind.
     *
     * @return array{process: resource, out: resource, err: resource, flavour: string}|null null if proc_open() itself failed
     */
    public static function spawn(string $basePath, string $flavour, string $address): ?array
    {
        $command = sprintf(
            '%s -S %s -t %s',
            escapeshellarg(PHP_BINARY),
            escapeshellarg($address),
            escapeshellarg($basePath),
        );

        $env = [...getenv(), 'APP_ENV' => $flavour];

        $process = proc_open($command, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $basePath, $env);

        if (!is_resource($process)) {
            return null;
        }

        fclose($pipes[0]);
        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);

        $status = proc_get_status($process);
        self::writePidFile($basePath, $flavour, $status['pid']);

        return ['process' => $process, 'out' => $pipes[1], 'err' => $pipes[2], 'flavour' => $flavour];
    }

    /**
     * Reads <flavour>.pid (via runningPid(), which already discards it if
     * stale) and sends SIGTERM to that PID, then waits (briefly — up to
     * one second) for it to actually exit before returning.
     */
    public static function stop(string $basePath, string $flavour): bool
    {
        $pid = self::runningPid($basePath, $flavour);

        if ($pid === null) {
            return false;
        }

        posix_kill($pid, SIGTERM);
        unlink(self::pidFilePath($basePath, $flavour));
        self::waitForExit($pid);

        return true;
    }

    /** Polls posix_kill($pid, 0) (a pure existence probe) until it fails or $timeoutMicroseconds runs out. */
    private static function waitForExit(int $pid, int $timeoutMicroseconds = 1_000_000): void
    {
        $elapsed = 0;
        $interval = 50_000;

        while ($elapsed < $timeoutMicroseconds && posix_kill($pid, 0)) {
            usleep($interval);
            $elapsed += $interval;
        }
    }

    /**
     * Blocks until Ctrl+C (or a SIGTERM from `apc stop`), relaying the
     * child's stdout/stderr to this terminal, then terminates it (if
     * still running) and cleans up its pidfile.
     *
     * @param array{process: resource, out: resource, err: resource, flavour: string} $child
     */
    public static function superviseUntilInterrupted(string $basePath, array $child): int
    {
        $running = true;
        $stop = static function () use (&$running): void {
            $running = false;
        };

        pcntl_async_signals(true);
        pcntl_signal(SIGINT, $stop);
        pcntl_signal(SIGTERM, $stop);

        while ($running) {
            self::relay($child['out']);
            self::relay($child['err']);

            $status = proc_get_status($child['process']);

            if (!$status['running']) {
                // One last drain — the process may have written its
                // final lines between the relay() calls above and
                // proc_get_status() catching the exit.
                self::relay($child['out']);
                self::relay($child['err']);
                printf("! exited (code %d)\n", $status['exitcode']);
                fclose($child['out']);
                fclose($child['err']);
                proc_close($child['process']);
                @unlink(self::pidFilePath($basePath, $child['flavour']));

                return 1;
            }

            usleep(200_000);
        }

        echo "\nStopping...\n";

        proc_terminate($child['process'], SIGTERM);
        self::relay($child['out']);
        self::relay($child['err']);
        fclose($child['out']);
        fclose($child['err']);
        proc_close($child['process']);
        @unlink(self::pidFilePath($basePath, $child['flavour']));
        echo "  ✓ stopped\n";

        return 0;
    }

    /** @param resource $pipe */
    private static function relay($pipe): void
    {
        $chunk = fread($pipe, 8192);

        if ($chunk === false || $chunk === '') {
            return;
        }

        echo $chunk;
    }

    private static function writePidFile(string $basePath, string $flavour, int $pid): void
    {
        $dir = "$basePath/storage/pids";

        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        file_put_contents(self::pidFilePath($basePath, $flavour), (string) $pid);
    }
}
