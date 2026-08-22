<?php

declare(strict_types=1);

namespace ApiPro;

/**
 * The one place a crash anywhere in api-pro gets written to disk — one
 * unbounded, append-only file, ALWAYS at the project root's
 * prologs.log, no matter which service/stage is running or what a
 * caller's own idea of "base path" happens to be. Deliberately never
 * rotated or truncated: this is a durable audit trail, not a rolling
 * debug log, so nothing here ever deletes anything from it.
 *
 * The path is derived from this FILE's own location
 * (packages/api-pro/Log.php, always exactly two directories below the
 * project root) rather than accepted as a parameter — a single named
 * service's own $basePath is still the same project root today, but
 * this way that's never something a future caller could get wrong or
 * override; there is exactly one prologs.log, ever.
 *
 * Controlled by LOGS in .env.<env> (defaults to on, same
 * enabled-unless-disabled convention as TESTER_ENABLED/
 * APP_VIEWER_ENABLED) — set LOGS=false to turn logging off entirely.
 * Read via Runner::env() directly rather than Runner::get(), since that
 * works even when Runner::boot() itself never finished (see
 * CrashPage::respond(), the one caller where that can happen) — env()
 * just reads $_ENV, with no dependency on self::$config being set.
 *
 * Used by Kernel::handle()'s own catch(\Throwable) (a request-time
 * crash) and by CrashPage::respond() (a boot-time one) — the two places
 * a \Throwable is the last thing standing between api-pro and PHP's own
 * raw error output.
 */
final class Log
{
    public static function crash(\Throwable $e): void
    {
        if (!filter_var(Runner::env('LOGS', true), FILTER_VALIDATE_BOOLEAN)) {
            return;
        }

        $entry = sprintf(
            "[%s] %s: %s in %s:%d\n%s\n\n",
            date('Y-m-d H:i:s'),
            $e::class,
            $e->getMessage(),
            $e->getFile(),
            $e->getLine(),
            $e->getTraceAsString(),
        );

        // Best-effort — a log write failing (read-only disk, whatever)
        // must never itself become the reason a crash response fails to
        // go out.
        @file_put_contents(self::path(), $entry, FILE_APPEND | LOCK_EX);
    }

    /** Always <project root>/prologs.log — see the class docblock for why this isn't a parameter. */
    public static function path(): string
    {
        return dirname(__DIR__, 2) . '/prologs.log';
    }
}
