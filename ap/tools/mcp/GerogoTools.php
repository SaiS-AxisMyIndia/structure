<?php

declare(strict_types=1);

/**
 * The actual capabilities gerogo's MCP dev-tool server exposes. Every
 * one either shells out to `apc` itself — so this never duplicates
 * `apc`'s own logic, just wraps it for an MCP client to call — or, for
 * list_routes, boots Runner in a short-lived child process (see
 * list-routes.php) to read the compiled route table without needing a
 * server already running.
 *
 * Each tool's own PHP process (or `apc`'s) is fully independent of this
 * long-lived server process — a crash or fatal error in one tool call
 * can't take the MCP connection itself down.
 */
final class GerogoTools
{
    public function __construct(private readonly string $basePath)
    {
    }

    /** @return list<array{name: string, description: string, inputSchema: array}> */
    public function definitions(): array
    {
        $flavour = [
            'type' => 'string',
            'description' => "Which .env.<flavour> to boot from — 'local', 'production', 'staging', or any other name. Defaults to a real APP_ENV env var, else 'local'.",
        ];

        return [
            [
                'name' => 'list_routes',
                'description' => "List every compiled route in the app (method, path, controller, action) — the exact same table Router dispatches from and Tester's /tester/routes reads.",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => ['flavour' => $flavour],
                    'additionalProperties' => false,
                ],
            ],
            [
                'name' => 'apc_build',
                'description' => "Run `apc build` — regenerates runner/ in place, force-compiles + caches the route table, and syncs the database schema for every #[ProEntity] class (per that flavour's TABLE_WRITE). Pass clean=true for `apc build --clean` (deletes the whole runner/ folder first).",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'clean' => ['type' => 'boolean', 'description' => 'Delete the whole runner/ folder first, then build.'],
                        'flavour' => $flavour,
                    ],
                    'additionalProperties' => false,
                ],
            ],
            [
                'name' => 'apc_install',
                'description' => "Run `apc install` — with no module (or 'gerogo'), validates every app.php module reference actually resolves; with another module name, shows that package's own version and whether/how app.php references it.",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'module' => ['type' => 'string', 'description' => "A packages/<name> to check instead of the whole app — e.g. 'pro-sql'."],
                        'version' => ['type' => 'string', 'description' => 'An expected version to validate against.'],
                        'flavour' => $flavour,
                    ],
                    'additionalProperties' => false,
                ],
            ],
            [
                'name' => 'apc_clean',
                'description' => 'Run `apc clean` — deletes the whole runner/ folder and the cached route table, with no rebuild afterward.',
                'inputSchema' => ['type' => 'object', 'properties' => new \stdClass(), 'additionalProperties' => false],
            ],
            [
                'name' => 'apc_start',
                'description' => "Start the app's PHP built-in server via `apc start`, in the BACKGROUND — this tool returns immediately once it's confirmed the server actually bound (or reports why it didn't); the server keeps running after this call returns. Use apc_stop to stop it.",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => [
                        'host_port' => ['type' => 'string', 'description' => "e.g. \"8081\" or \"127.0.0.1:8081\" — defaults to that flavour's own PORT, else 7070."],
                        'flavour' => $flavour,
                    ],
                    'additionalProperties' => false,
                ],
            ],
            [
                'name' => 'apc_stop',
                'description' => "Stop a server a matching apc_start began, wherever it's running — via `apc stop`.",
                'inputSchema' => [
                    'type' => 'object',
                    'properties' => ['flavour' => $flavour],
                    'additionalProperties' => false,
                ],
            ],
        ];
    }

    /**
     * @param array<string, mixed> $arguments
     * @return array{text: string, isError: bool}
     */
    public function call(string $name, array $arguments): array
    {
        try {
            $text = match ($name) {
                'list_routes' => $this->listRoutes($arguments),
                'apc_build' => $this->apcBuild($arguments),
                'apc_install' => $this->apcInstall($arguments),
                'apc_clean' => $this->runApc(['clean']),
                'apc_start' => $this->apcStart($arguments),
                'apc_stop' => $this->apcStop($arguments),
                default => throw new \InvalidArgumentException("Unknown tool: $name"),
            };

            return ['text' => $text, 'isError' => false];
        } catch (\Throwable $e) {
            return ['text' => $e->getMessage(), 'isError' => true];
        }
    }

    /** @param array<string, mixed> $arguments */
    private function listRoutes(array $arguments): string
    {
        return $this->exec([
            PHP_BINARY,
            __DIR__ . '/list-routes.php',
            (string) ($arguments['flavour'] ?? ''),
        ]);
    }

    /** @param array<string, mixed> $arguments */
    private function apcBuild(array $arguments): string
    {
        $args = ['build'];

        if (!empty($arguments['clean'])) {
            $args[] = '--clean';
        }

        return $this->runApc([...$args, ...$this->flavourFlags($arguments)]);
    }

    /** @param array<string, mixed> $arguments */
    private function apcInstall(array $arguments): string
    {
        $args = ['install'];

        if (isset($arguments['module'])) {
            $args[] = (string) $arguments['module'];

            if (isset($arguments['version'])) {
                $args[] = (string) $arguments['version'];
            }
        }

        return $this->runApc([...$args, ...$this->flavourFlags($arguments)]);
    }

    /** @param array<string, mixed> $arguments */
    private function apcStop(array $arguments): string
    {
        return $this->runApc(['stop', ...$this->flavourFlags($arguments)]);
    }

    /**
     * Deliberately NOT `runApc()` — `apc start` never exits on its own,
     * so waiting for it to finish (what runApc()/proc_close() would do)
     * would hang this tool call forever. Instead: launch it detached (a
     * shell `nohup ... &`, so its lifetime isn't tied to any resource
     * THIS process holds), give it a moment to either bind or fail fast,
     * then report back either way.
     *
     * @param array<string, mixed> $arguments
     */
    private function apcStart(array $arguments): string
    {
        $args = ['start'];

        if (isset($arguments['host_port'])) {
            $args[] = (string) $arguments['host_port'];
        }

        $args = [...$args, ...$this->flavourFlags($arguments)];

        // A single simple command, deliberately no `cd X &&` prefix (both
        // PHP_BINARY and the apc path below are already absolute, so
        // nothing here needs a working directory) — a `&&`-joined
        // compound run through shell_exec()'s underlying popen() makes
        // bash fork an extra subshell for the backgrounded job that, on
        // this machine, doesn't detach cleanly: it keeps a duplicate of
        // popen()'s own pipe open and won't let shell_exec() return
        // until that subshell itself exits — which, for a server that's
        // supposed to keep running, is never. A single command doesn't
        // need that extra subshell at all (bash execs `nohup` directly
        // in place), so this returns immediately either way. Confirmed
        // by direct reproduction — this exact difference is what caused
        // it, not a fluke.
        $logFile = tempnam(sys_get_temp_dir(), 'apc-start-');
        $command = sprintf(
            'nohup %s %s %s < /dev/null > %s 2>&1 & echo $!',
            escapeshellarg(PHP_BINARY),
            escapeshellarg("$this->basePath/apc"),
            implode(' ', array_map('escapeshellarg', $args)),
            escapeshellarg($logFile),
        );

        $pid = (int) trim((string) shell_exec($command));

        // Give it a moment to either bind successfully or fail fast (a
        // port already in use, a bad DB connection during the
        // schema-sync step, ...) before reporting.
        usleep(1_500_000);

        $alive = $pid > 0 && posix_kill($pid, 0);
        $output = is_file($logFile) ? (string) file_get_contents($logFile) : '';
        @unlink($logFile);

        if (!$alive) {
            throw new \RuntimeException("Failed to start — it exited immediately:\n$output");
        }

        return "Started (pid $pid), running in the background. Use apc_stop to stop it.\n\n$output";
    }

    /** @param array<string, mixed> $arguments @return list<string> */
    private function flavourFlags(array $arguments): array
    {
        return isset($arguments['flavour']) ? ['--flavour', (string) $arguments['flavour']] : [];
    }

    /** @param list<string> $args */
    private function runApc(array $args): string
    {
        return $this->exec([PHP_BINARY, "$this->basePath/apc", ...$args]);
    }

    /**
     * Blocks until the command exits — fine for build/install/clean/stop
     * (all naturally terminate on their own); never use this for
     * apc_start, which doesn't.
     *
     * @param list<string> $command
     */
    private function exec(array $command): string
    {
        $process = proc_open($command, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, $this->basePath);

        if (!is_resource($process)) {
            throw new \RuntimeException('Failed to start: ' . implode(' ', $command));
        }

        fclose($pipes[0]);
        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        $exitCode = proc_close($process);

        $output = trim($stdout . ($stderr !== '' ? "\n$stderr" : ''));

        if ($exitCode !== 0) {
            throw new \RuntimeException(($output !== '' ? "$output\n" : '') . "(exit code $exitCode)");
        }

        return $output !== '' ? $output : '(no output)';
    }
}
