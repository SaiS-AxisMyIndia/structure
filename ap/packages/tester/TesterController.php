<?php

declare(strict_types=1);

namespace Tester;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Page;
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
     * no controller/action internals. Excludes:
     *
     *   - /tester's own two routes (this method and index() above) —
     *     the tool's own plumbing, not part of the app's API;
     *   - every AppViewer route — a sibling dev tool's own plumbing,
     *     same reasoning, just a different tool (checked by namespace
     *     prefix rather than importing AppViewer\AppViewerController
     *     directly, so this package doesn't need to depend on that one
     *     just to know to skip it);
     *   - every page-rendering route (see isPageRoute()) — sending one
     *     of those through here would just dump raw HTML into a UI
     *     built for viewing JSON, which isn't useful. AppViewer is
     *     where those belong instead — it lists exactly the routes
     *     this excludes for that reason.
     */
    #[GetMapping('/routes')]
    public function routes(Request $request): array
    {
        $appRoutes = array_values(array_filter(
            Runner::routes(),
            static fn (array $route): bool => $route['controller'] !== self::class
                && !str_starts_with($route['controller'], 'AppViewer\\')
                && !self::isPageRoute($route['controller'], $route['action']),
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

    /**
     * Page::isReturnedBy() (generic, framework-level, no app-specific
     * knowledge) — reliable on its own now that RouteCompiler enforces
     * the split at compile time: a #[PageController] action always
     * declares Page, a #[RestController] action never does (see
     * RouteCompiler::assertReturnType()), so this can't disagree with
     * which attribute a route's controller actually carries.
     * AppViewer\AppViewerController uses this exact same check
     * (inverted — to include, not exclude) to build its own list of
     * exactly the routes this excludes.
     */
    private static function isPageRoute(string $controllerClass, string $action): bool
    {
        return Page::isReturnedBy($controllerClass, $action);
    }
}
