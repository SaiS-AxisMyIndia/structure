<?php

declare(strict_types=1);

// Config for packages/app-viewer — a Tester-style explorer for this
// app's Page-returning routes, served at /app-viewer. Consumed by
// AppViewer\AppViewerModule via Runner::get('app_viewer'). Enabled by
// default (dev convenience); set APP_VIEWER_ENABLED=false in .env.production
// before deploying somewhere it shouldn't be publicly reachable — same
// reasoning as TESTER_ENABLED.

return [
    'enabled' => filter_var($_ENV['APP_VIEWER_ENABLED'] ?? true, FILTER_VALIDATE_BOOLEAN),
];
