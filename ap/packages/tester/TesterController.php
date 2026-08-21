<?php

declare(strict_types=1);

namespace Tester;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Request;
use ApiPro\Response;
use ApiPro\Runner;

/**
 * Serves the tester UI itself (a static page) plus the one JSON endpoint
 * it needs to render an endpoint list — everything else it does (sending
 * requests, showing responses) happens client-side, calling the app's
 * real endpoints directly via fetch(), same-origin.
 */
#[RestController(prefix: '/tester')]
class TesterController
{
    #[GetMapping]
    public function index(Request $request): never
    {
        Response::html((string) file_get_contents(__DIR__ . '/resources/index.html'));
    }

    /**
     * The compiled route table, reduced to what the UI needs — no regex,
     * no controller/action internals. Excludes /tester's own two routes
     * (this method and index() above) — those are the tool's own
     * plumbing, not part of the app's API, so they'd just be noise in
     * the list of endpoints to try out.
     */
    #[GetMapping('/routes')]
    public function routes(Request $request): array
    {
        $appRoutes = array_values(array_filter(
            Runner::routes(),
            static fn (array $route): bool => $route['controller'] !== self::class,
        ));

        return array_map(
            static function (array $route): array {
                $segments = explode('\\', $route['controller']);
                $name = end($segments);

                // "UserController" -> "User", "HealthController" -> "Health"
                // — just a grouping label for the UI, not meant to expose
                // internal namespace structure or repeat the boilerplate
                // "Controller" suffix every class already has.
                if (str_ends_with($name, 'Controller')) {
                    $name = substr($name, 0, -strlen('Controller'));
                }

                return [
                    'method' => $route['method'],
                    'path' => $route['path'],
                    'prefix' => $route['prefix'],
                    'comment' => $route['comment'],
                    'controller' => $name,
                    'fields' => $route['fields'],
                    'middleware' => array_map(
                        static fn (array $mw): string => $mw['class'],
                        $route['middleware'],
                    ),
                ];
            },
            $appRoutes,
        );
    }
}
