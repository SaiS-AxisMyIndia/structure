<?php

declare(strict_types=1);

// The configuration set for running — the one file that loads
// .env.<env>, resolves modules, compiles routes, and hands back
// the fully resolved config. Nothing else should load .env.<env>,
// require app.php, or read runner/*.php directly — everything
// downstream asks Runner for it.

$basePath = dirname(__DIR__);
require_once "$basePath/vendor/autoload.php";

use Gerogo\Runner;

Runner::boot($basePath);

return Runner::config();
