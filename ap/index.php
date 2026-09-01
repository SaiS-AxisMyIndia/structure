<?php

declare(strict_types=1);

// Front controller — every request is rewritten here by .htaccess.
// This plays the role of the embedded server bootstrap in a Spring Boot
// jar's main() method: boot the runner (autoload + .env + app.php,
// exactly once), then boot the Kernel and handle the request.

// Raw PHP diagnostics (an E_WARNING from the require below, for
// instance) are never what a client should see, in any env — from here
// on, Gerogo\CrashPage is the only thing allowed to decide what a crash
// looks like on the wire.
ini_set('display_errors', '0');
error_reporting(E_ALL);

use Gerogo\CrashPage;
use Gerogo\Kernel;

// Wrapped in try/catch: this is the one place a broken BOOT itself (a
// missing/wiped runner/, for instance — see `apc build --clean`) has to
// be handled, since nothing here can assume Kernel — or even Runner —
// is safely usable yet. See CrashPage::respond()'s own comment.
try {
    $config = require __DIR__ . '/runner/runner.php';

    Kernel::boot($config)->handle();
} catch (\Throwable $e) {
    // runner/runner.php's own first job (require vendor/autoload.php)
    // redone here directly — needed when THAT'S the file that just
    // failed to even exist, since nothing gerogo provides is reachable
    // otherwise. A no-op (require_once) if it already ran fine.
    require_once __DIR__ . '/vendor/autoload.php';

    CrashPage::respond($e, __DIR__);
}
