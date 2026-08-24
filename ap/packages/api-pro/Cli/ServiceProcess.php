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
     * Where `apc service:start`'s detached child's stdout/stderr get
     * appended, and what `apc service:logs` reads back — the one place
     * this filename convention lives, the same role pidFilePath() plays
     * for pidfiles.
     */
    public static function logFilePath(string $basePath, string $key): string
    {
        return "$basePath/storage/logs/$key.log";
    }

    /**
     * The pid a key's pidfile currently points at, IF that process is
     * still actually alive (posix_kill($pid, 0) as a pure existence
     * probe — no signal is delivered) — null otherwise, including "no
     * pidfile at all". A stale pidfile (process already gone) is
     * removed here rather than left behind, so `service:list`/`stop`/
     * `start` never have to reason about a pidfile that's lying.
     */
    public static function runningPid(string $basePath, string $key): ?int
    {
        $path = self::pidFilePath($basePath, $key);

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
     * Like spawn(), but for a service meant to keep running after THIS
     * process exits — `apc service:start` prints the pid and returns
     * right away, instead of blocking in the foreground the way
     * superviseUntilInterrupted() makes `apc start` do.
     *
     * Deliberately does NOT go through proc_open(): a proc_open()
     * resource that's never proc_close()'d gets proc_close()'d anyway,
     * implicitly, when it's garbage-collected or the request ends — and
     * that call BLOCKS until the child exits, which would hang this
     * command forever against a long-running server. Shelling out with
     * a trailing `&` backgrounds the process at the shell level, fully
     * independent of this PHP process from that point on; `echo $!`
     * (run synchronously right after, in the same `sh -c` invocation)
     * captures the backgrounded job's own pid.
     *
     * Stdout/stderr are appended straight to $logPath — a real file,
     * not a pipe this process would otherwise have to keep draining
     * for the child to avoid blocking on a full pipe buffer — so once
     * this returns, the child owes this process nothing further. See
     * ServiceLogsCommand for reading that file back.
     *
     * @return int|null the backgrounded process's pid, or null if the shell reported none
     */
    public static function spawnDetached(string $basePath, string $key, string $address, string $stage, ?string $service, string $logPath): ?int
    {
        $logDir = dirname($logPath);

        if (!is_dir($logDir)) {
            mkdir($logDir, 0775, true);
        }

        file_put_contents(
            $logPath,
            sprintf("\n==> apc service:start %s --%s @ %s\n", $service ?? $key, $stage, date('c')),
            FILE_APPEND,
        );

        $envAssignment = 'APP_ENV=' . escapeshellarg($stage);

        if ($service !== null) {
            $envAssignment .= ' APC_SERVICE=' . escapeshellarg($service);
        }

        $command = sprintf(
            '%s %s -S %s -t %s >> %s 2>&1 & echo $!',
            $envAssignment,
            escapeshellarg(PHP_BINARY),
            escapeshellarg($address),
            escapeshellarg($basePath),
            escapeshellarg($logPath),
        );

        $pid = (int) trim((string) shell_exec($command));

        if ($pid <= 0) {
            return null;
        }

        self::writePidFile($basePath, $key, $pid);

        return $pid;
    }

    /**
     * Reads <key>.pid (via runningPid(), which already discards it if
     * stale) and sends SIGTERM to that PID, then waits (briefly — up to
     * one second) for it to actually exit before returning, so a
     * command that stops and immediately restarts the same service
     * (see ServiceRestartCommand) doesn't race the old process for its
     * own port.
     */
    public static function stop(string $basePath, string $key): bool
    {
        $pid = self::runningPid($basePath, $key);

        if ($pid === null) {
            return false;
        }

        posix_kill($pid, SIGTERM);
        unlink(self::pidFilePath($basePath, $key));
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
