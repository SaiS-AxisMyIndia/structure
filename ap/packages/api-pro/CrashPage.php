<?php

declare(strict_types=1);

namespace ApiPro;

/**
 * The one place a broken BOOT — not a normal request-time exception; see
 * Kernel::handle()'s own catch(\Throwable) for that — gets turned into a
 * response instead of PHP's raw warning/fatal-error output. index.php's
 * own try/catch calls this, since a boot failure (a missing runner/, for
 * instance) can happen before Kernel — or even Runner — is safely
 * usable.
 *
 * Always the same plain "server is down" page, in every env, never the
 * real exception — a boot failure is infrastructure being broken, not
 * something a browser should ever have to make sense of. The real
 * detail (message, file:line, trace) still goes to prologs.log first
 * (see Log::crash()) and, in local dev, to the terminal `apc start`
 * itself is running in — that's where a developer actually looks to fix
 * this, not the response body. Responds HTTP 503.
 */
final class CrashPage
{
    public static function respond(\Throwable $e, string $basePath): never
    {
        // Runner::boot() already tolerates every runner/*.php config
        // file being missing (see its own comment) — its only two real
        // dependencies are app.php and vendor/autoload.php, neither of
        // which is what usually breaks here. Calling it again is a
        // no-op if it already succeeded once before this crash. Purely
        // best-effort, only so Log::crash()'s own LOGS check reflects a
        // real .env.<stage> value when one was reachable — the response
        // below doesn't depend on it either way.
        try {
            Runner::boot($basePath);
        } catch (\Throwable) {
            // Nothing to do — Log::crash() below still defaults LOGS to
            // enabled with nothing loaded into $_ENV at all.
        }

        Log::crash($e);

        http_response_code(503);
        header('Content-Type: text/html; charset=utf-8');
        echo self::page();

        exit;
    }

    private static function page(): string
    {
        return <<<'HTML'
            <!doctype html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Server Down</title>
                <style>
                    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #111; color: #eee; }
                    .box { text-align: center; }
                    h1 { font-size: 1.5rem; margin-bottom: .5rem; }
                    p { color: #999; }
                </style>
            </head>
            <body>
                <div class="box">
                    <h1>Server Down</h1>
                    <p>Please try after sometime.</p>
                </div>
            </body>
            </html>
            HTML;
    }
}
