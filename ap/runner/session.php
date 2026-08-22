<?php

declare(strict_types=1);

// JWT-style session config for packages/session — consumed by
// Session\SessionModule via Runner::get('session'). Reads SESSION_*
// straight from $_ENV, which runner/runner.php already populated from
// .env.<env> before this file is required.

return [
    'secret' => $_ENV['SESSION_SECRET'] ?? 'change-me-in-.env.<env>',
    'ttl' => (int) ($_ENV['SESSION_TTL'] ?? 3600),
    'refresh_ttl' => (int) ($_ENV['SESSION_REFRESH_TTL'] ?? 1_209_600),
    'version' => (int) ($_ENV['SESSION_VERSION'] ?? 1),
    'enc' => filter_var($_ENV['SESSION_ENC'] ?? false, FILTER_VALIDATE_BOOLEAN),
];
