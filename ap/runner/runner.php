<?php

declare(strict_types=1);

// The configuration set for running — the one file that loads .env,
// app.php, and every runner/*.php module config, and hands back the
// fully resolved config. Nothing else should load .env, require app.php,
// or require any other runner/*.php file directly; index.php requires
// THIS file, and any module/service that needs a config or env value
// calls ApiPro\Runner::get()/env() instead of re-reading any of it.
//
// The heavier, once-per-boot work this drives — module resolution and
// route compilation, both cached in ApiPro\Runner — is what "the server
// running" means here. In local development (app.php's env: 'local'),
// nothing is written to a cache file, so editing a controller or module
// takes effect on the very next request; only outside `local` does a
// later request reuse what an earlier one already compiled.

$basePath = dirname(__DIR__);

require_once "$basePath/vendor/autoload.php";

use ApiPro\Runner;

Runner::boot($basePath);

return Runner::config();
