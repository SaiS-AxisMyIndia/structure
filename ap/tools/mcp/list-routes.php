<?php

declare(strict_types=1);

// Standalone script, deliberately NOT part of any packages/ autoload
// tree — boots just enough of Runner to read the compiled route table,
// without needing a server already running. A fresh process every call
// (via ApiProTools::listRoutes()) so each one correctly honors its own
// --stage/--service, since Runner::boot() is a once-per-process
// singleton and this MCP server's own process is long-lived.

$basePath = dirname(__DIR__, 2);
require_once "$basePath/vendor/autoload.php";

$stage = ($argv[1] ?? '') !== '' ? $argv[1] : null;
$service = ($argv[2] ?? '') !== '' ? $argv[2] : null;

ApiPro\Runner::boot($basePath, $stage, $service);

$routes = array_map(
    static fn (array $route): array => [
        'method' => $route['method'],
        'path' => $route['path'],
        'controller' => $route['controller'],
        'action' => $route['action'],
    ],
    ApiPro\Runner::routes(),
);

echo json_encode($routes, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
