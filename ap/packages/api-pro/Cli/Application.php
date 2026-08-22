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
        'stop' => StopCommand::class,
        'build' => BuildCommand::class,
        'clean' => CleanCommand::class,
        'install' => InstallCommand::class,
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

          apc -v, --version                       app + every package's version
          apc start [host:port]                   clean + rebuild, then start PHP's built-in server (default host 127.0.0.1, port from .env's PORT, else 7070)
          apc start [--<stage>] --<svc1> --<svc2> one server PER named service, each on its own .env.<svc>.<stage>'s PORT, together until Ctrl+C
          apc stop                                stop the ONE server a matching `apc start` began, wherever it's running
          apc stop [--<stage>] --<svc1> --<svc2>  stop several named services at once — the multi-service form
          apc build                               regenerate runner/ in place, force-compile + cache the route table (deploy-time build step)
          apc build -c, --clean                   delete the whole runner/ folder first, then build as above
          apc clean                               delete the whole runner/ folder (and route cache) — no rebuild
          apc ... --<stage>                       --local, --production, or --staging: which .env.<stage> to boot from (else real APP_ENV env var, else 'local')
          apc ... --<service>                     any OTHER --name: which named microservice to boot as (.env.<service>.<stage-abbrev>) — see README
          apc install [module] [version]           no module (or `api-pro`): validate every module resolves (optionally against an expected app version)
          apc install <module> [version]           any other module: show its info (optionally validate its version)

        HELP;
    }
}
