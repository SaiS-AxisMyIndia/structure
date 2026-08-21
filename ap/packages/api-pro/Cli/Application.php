<?php

declare(strict_types=1);

namespace ApiPro\Cli;

/**
 * The `apc` CLI's dispatcher — this project's console, the same idea as
 * Laravel's `artisan` or a Spring Boot actuator command: operational
 * commands that sit next to the app rather than behind an HTTP route.
 * Runner::boot() must already have run by the time run() is called (the
 * `apc` script does this before constructing this class).
 */
final class Application
{
    /** @var array<string, class-string<Command>> */
    private const COMMANDS = [
        'start' => StartCommand::class,
        'build' => BuildCommand::class,
        'install' => InstallCommand::class,
        'module' => ModuleCommand::class,
    ];

    public function __construct(private readonly string $basePath)
    {
    }

    /** @param list<string> $args argv without the script name */
    public function run(array $args): int
    {
        $first = $args[0] ?? null;

        if ($first === null || in_array($first, ['-h', '--help'], true)) {
            $this->printHelp();

            return 0;
        }

        if (in_array($first, ['-v', '--version'], true)) {
            return (new VersionCommand($this->basePath))->run(array_slice($args, 1));
        }

        if (!isset(self::COMMANDS[$first])) {
            fwrite(STDERR, "Unknown command [$first]. Run `apc --help` for usage.\n");

            return 1;
        }

        $commandClass = self::COMMANDS[$first];

        return (new $commandClass($this->basePath))->run(array_slice($args, 1));
    }

    private function printHelp(): void
    {
        echo <<<HELP
        apc — this project's CLI

          apc -v, --version                 app + every package's version
          apc start [host:port]             clean + rebuild, then start PHP's built-in server (default 127.0.0.1:7070)
          apc build                         force-compile + cache the route table now (deploy-time build step)
          apc build -c, --clean             delete the cached route table
          apc install [version]             validate every module resolves (optionally against an expected app version)
          apc module <name> [version]       show one module's info (optionally validate its version)

        HELP;
    }
}
