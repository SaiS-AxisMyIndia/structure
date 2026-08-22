<?php

declare(strict_types=1);

namespace AppViewer;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\PostMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Container;
use ApiPro\Page;
use ApiPro\PacketFailed;
use ApiPro\Request;
use ApiPro\Response;
use ApiPro\Runner;

/**
 * Serves the AppViewer UI itself (a static page, same idea as
 * Tester\TesterController::index()) plus the JSON/HTML endpoints it
 * needs: one listing every Page-returning route, one re-invoking a
 * specific one of those fresh and returning the props it built its Page
 * with, and one re-rendering that same page's view with EDITED props
 * instead — how the UI's editable "Props JSON" box actually previews a
 * change. The real, LIVE page HTML is never proxied through here at
 * all — the UI's iframe starts pointed straight at the real route,
 * same-origin, exactly as a real visitor would see it; only once you
 * edit props and ask to preview them does the iframe switch to
 * showing what render() below hands back instead.
 */
#[RestController(prefix: '/app-viewer')]
class AppViewerController
{
    public function __construct(private readonly Container $container)
    {
    }

    #[GetMapping]
    public function index(Request $request): never
    {
        Response::html((string) file_get_contents(__DIR__ . '/resources/index.html'));
    }

    /**
     * The compiled route table, reduced to routes whose controller
     * method actually declares Page as its return type (or as one
     * member of a union return type) — checked via Reflection, since
     * RouteCompiler's own compiled shape carries no return-type info at
     * all (nothing in the framework needs it for normal dispatch;
     * Kernel::handle() decides purely from the runtime value). Excludes
     * /app-viewer's own route, the same way Tester excludes its own two.
     */
    #[GetMapping('/pages')]
    public function pages(Request $request): array
    {
        $pageRoutes = array_values(array_filter(
            Runner::routes(),
            static fn (array $route): bool => $route['controller'] !== self::class
                && self::returnsPage($route['controller'], $route['action']),
        ));

        return array_map(self::toListEntry(...), $pageRoutes);
    }

    /**
     * Re-invokes one specific Page-returning action fresh — side
     * effects included, the same way clicking Tester's Send button
     * re-runs the real thing rather than replaying a cached result —
     * and returns Page::getProps() instead of rendering it, so the UI
     * can show what the page was actually built with without trying to
     * scrape rendered HTML for data that was never embedded in it.
     *
     * $controller/$action are NOT trusted as typed — only a pair that's
     * genuinely an already-compiled, Page-returning route (exactly what
     * pages() above would list) is allowed through; anything else 400s
     * before anything gets instantiated or called, so this can't become
     * a way to invoke an arbitrary public method on an arbitrary class.
     *
     * v1 limitation: the real Request this controller itself received —
     * carrying AppViewer's own `?controller=&action=` query string, not
     * whatever the target action would normally see — is what gets
     * passed through. Harmless for a Page action that ignores $request
     * entirely (true of every current one in this app); a future Page
     * route that actually reads query/body input here would see the
     * wrong thing.
     */
    #[GetMapping('/props')]
    public function props(Request $request): array
    {
        $controllerClass = $request->query->getString('controller');
        $action = $request->query->getString('action');

        self::assertKnownPageRoute($controllerClass, $action);

        return self::invokePage($this->container, $controllerClass, $action, $request)->getProps();
    }

    /**
     * Re-renders a Page-returning action's VIEW with props from the
     * request body instead of whatever that action computed live — the
     * whole point of making AppViewer's props box editable: type
     * something different in, see this instead of the live version.
     *
     * The real action still runs once first (same whitelist,
     * same v1 $request caveat as props() above) — not to use its
     * props, only to find out which view name it actually used
     * (Page::getView()), so this doesn't need its own separate,
     * hand-maintained list of "which view does each page use".
     *
     * A Page built via the title()/body() template builder rather than
     * view() has no view name to reuse and 400s here instead of
     * guessing at one.
     */
    #[PostMapping('/render')]
    public function render(Request $request): never
    {
        $controllerClass = $request->query->getString('controller');
        $action = $request->query->getString('action');

        self::assertKnownPageRoute($controllerClass, $action);

        $original = self::invokePage($this->container, $controllerClass, $action, $request);
        $view = $original->getView();

        if ($view === null) {
            throw new PacketFailed(
                "$controllerClass::$action() doesn't use view()/props() — nothing to re-render with edited props",
                0,
                400,
            );
        }

        Response::html((new Page())->view($view)->props($request->body->all())->render());
    }

    private static function assertKnownPageRoute(string $controllerClass, string $action): void
    {
        foreach (Runner::routes() as $route) {
            if (
                $route['controller'] === $controllerClass
                && $route['action'] === $action
                && self::returnsPage($route['controller'], $route['action'])
            ) {
                return;
            }
        }

        throw new PacketFailed('Not a known Page-returning route', 0, 400);
    }

    private static function invokePage(Container $container, string $controllerClass, string $action, Request $request): Page
    {
        $controller = $container->make($controllerClass);
        $result = $controller->$action($request);

        if (!$result instanceof Page) {
            // Only reachable if the same method's return type changed
            // between routes() being compiled/cached and this request —
            // assertKnownPageRoute() already guarantees it currently
            // declares Page.
            throw new PacketFailed("$controllerClass::$action() did not return a Page", 0, 500);
        }

        return $result;
    }

    /**
     * Two independent signals, either one is enough: this app's own
     * convention of keeping every page controller under Lib\Controllers
     * (see e.g. Lib\Controllers\HomeController), or the method's own
     * declared return type (Page::isReturnedBy() — generic, framework-
     * level, no app-specific knowledge). The namespace check catches a
     * page controller even if some future one doesn't declare `: Page`
     * explicitly; Tester\TesterController uses this exact same pair of
     * checks (inverted — to exclude, not include) to keep its own list
     * to JSON/API routes only.
     */
    private static function returnsPage(string $controllerClass, string $action): bool
    {
        return str_starts_with($controllerClass, 'Lib\\Controllers\\')
            || Page::isReturnedBy($controllerClass, $action);
    }

    /** @param array{method: string, path: string, prefix: string, comment: string|null, controller: string, action: string, middleware: array} $route */
    private static function toListEntry(array $route): array
    {
        $segments = explode('\\', $route['controller']);
        $name = end($segments);

        // "HomeController" -> "Home" — just a grouping label for the
        // UI, the same convention Tester uses for its own route list.
        if (str_ends_with($name, 'Controller')) {
            $name = substr($name, 0, -strlen('Controller'));
        }

        return [
            'method' => $route['method'],
            'path' => $route['path'],
            'prefix' => $route['prefix'],
            'comment' => $route['comment'],
            'controller' => $name,
            // The real FQCN + method name — needed by props() above to
            // actually re-invoke the right thing; Tester's own list never
            // needs to expose this since it never re-instantiates
            // anything itself, the browser just fetches the real URL.
            'controllerClass' => $route['controller'],
            'action' => $route['action'],
            'middleware' => array_map(
                static fn (array $mw): string => $mw['class'],
                $route['middleware'],
            ),
        ];
    }
}
