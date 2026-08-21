<?php

declare(strict_types=1);

// Front controller — every request is rewritten here by .htaccess.
// This plays the role of the embedded server bootstrap in a Spring Boot
// jar's main() method: boot the runner (autoload + .env + app.php,
// exactly once), then boot the Kernel and handle the request.

use ApiPro\Kernel;

$config = require __DIR__ . '/runner/runner.php';

Kernel::boot($config)->handle();
