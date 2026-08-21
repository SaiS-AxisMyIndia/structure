<?php

declare(strict_types=1);

// The app's own controller classes — consumed by App\Application via
// Runner::get('controllers') instead of hardcoding the list inside the
// class itself. This is only for THIS app's src/Controllers/ — a package
// module (ProSqlModule, SessionModule, ...) still declares its own
// controllers() directly, since it isn't part of this app's manifest.

use App\Controllers\AuthController;
use App\Controllers\HealthController;
use App\Controllers\HomeController;
use App\Controllers\UserController;

return [
    HealthController::class,
    UserController::class,
    HomeController::class,
    AuthController::class,
];
