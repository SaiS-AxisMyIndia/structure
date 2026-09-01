<?php

declare(strict_types=1);

// Standalone script, deliberately NOT part of any packages/ autoload
// tree — boots just enough of Runner to read the compiled route table,
// without needing a server already running. A fresh process every call
// (via GerogoTools::listRoutes()) so each one correctly honors its own
// -f/--flavour, since Runner::boot() is a once-per-process singleton
// and this MCP server's own process is long-lived.

$basePath = dirname(__DIR__, 2);
require_once "$basePath/vendor/autoload.php";

$flavour = ($argv[1] ?? '') !== '' ? $argv[1] : null;

Gerogo\Runner::boot($basePath, $flavour);

$routes = array_map(
    static fn (array $route): array => [
        'method' => $route['method'],
        'path' => $route['path'],
        'controller' => $route['controller'],
        'action' => $route['action'],
    ],
    Gerogo\Runner::routes(),
);

echo json_encode($routes, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
