<?php

declare(strict_types=1);

namespace Gerogo\Cli;

use Gerogo\Runner;

/**
 * `apc clean` — deletes the whole runner/ directory, completely, and
 * nothing else. Same removal `apc build --clean` does before it
 * regenerates runner/ from scratch, but WITHOUT the regenerate step
 * afterwards — this command only tears down. Run `apc build` (or
 * `apc build --clean`, equivalent here since there's nothing left to
 * delete) afterwards to rebuild it.
 *
 * Also clears the cached route table, for the same reason
 * `apc build --clean` does: a route cache pointing at controllers that
 * runner/'s own (now-deleted) config no longer backs is worse than no
 * cache at all.
 */
final class CleanCommand implements Command
{
    public function __construct(private readonly string $basePath)
    {
    }

    public function run(array $args): int
    {
        if ($args !== []) {
            fwrite(STDERR, "Usage: apc clean\n");

            return 1;
        }

        if (Runner::clearRoutesCache()) {
            printf("Removed %s\n", Runner::routesCachePath());
        }

        $runnerPath = "$this->basePath/runner";

        printf(
            Runner::wipeRunnerDirectory($this->basePath)
                ? "Removed %s\n"
                : "%s did not exist — nothing to remove\n",
            $runnerPath,
        );

        return 0;
    }
}
