<?php

declare(strict_types=1);

// Config for packages/tester — a Swagger-like interactive API explorer
// served at /tester. Consumed by Tester\TesterModule via
// Runner::get('tester'). Enabled by default (dev convenience); set
// TESTER_ENABLED=false in .env.production before deploying somewhere the endpoint
// list/explorer shouldn't be publicly reachable.

return [
    'enabled' => filter_var($_ENV['TESTER_ENABLED'] ?? true, FILTER_VALIDATE_BOOLEAN),
];
