<?php

declare(strict_types=1);

namespace AppViewer;

use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\PostMapping;
use ApiPro\Attributes\RestController;
use ApiPro\Container;
use ApiPro\InputBag;
use ApiPro\Page;
use ApiPro\PacketFailed;
use ApiPro\Request;
use ApiPro\Response;
use ApiPro\Runner;

/**
 * Serves the AppViewer UI itself (a static page, same idea as
 * Tester\TesterController::index()) plus the two endpoints it needs:
 * one listing every Page-returning route (route.fields included, the
 * exact same shape Tester's own list carries — see
 * RouteCompiler::fieldsOf()), one re-invoking a specific one of those
 * with a REAL, synthetic Request built from whatever the UI's Request
 * panel was filled in with, returning the fully rendered HTML. The
 * real, LIVE page HTML is never proxied through here at all for the
 * default view — the UI's iframe starts pointed straight at the real
 * route, same-origin, exactly as a real visitor would see it; only once
 * you fill in the Request panel and Load does the iframe switch to
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
     * Re-invokes one specific Page-returning action fresh — side effects
     * included, the same way clicking Tester's Send button re-runs the
     * real thing rather than replaying a cached result — against a REAL,
     * synthetic Request (see buildTargetRequest()), and returns the
     * fully rendered HTML. Works for a Page built either way (the
     * title()/body() template builder, or view()) since it renders the
     * REAL Page object the action actually returned.
     *
     * $controller/$action are NOT trusted as typed — only a pair that's
     * genuinely an already-compiled, Page-returning route (exactly what
     * pages() above would list) is allowed through; anything else 400s
     * before anything gets instantiated or called, so this can't become
     * a way to invoke an arbitrary public method on an arbitrary class.
     */
    #[PostMapping('/render')]
    public function render(Request $request): never
    {
        [$controllerClass, $action, $route] = self::resolveTarget($request);

        Response::html(self::invokePage($this->container, $controllerClass, $action, self::buildTargetRequest($request, $route))->render());
    }

    /** @return array{0: class-string, 1: string, 2: array} controllerClass, action, and the matched compiled route */
    private static function resolveTarget(Request $request): array
    {
        $controllerClass = $request->query->getString('controller');
        $action = $request->query->getString('action');

        foreach (Runner::routes() as $route) {
            if (
                $route['controller'] === $controllerClass
                && $route['action'] === $action
                && self::returnsPage($route['controller'], $route['action'])
            ) {
                return [$controllerClass, $action, $route];
            }
        }

        throw new PacketFailed('Not a known Page-returning route', 0, 400);
    }

    /**
     * Builds the Request the target action would actually receive from a
     * REAL client — query/body/path-param values read from THIS
     * request's own JSON body (`{query, body, params}`, exactly what the
     * AppViewer UI's Request panel — the same field inputs Tester
     * renders, driven by the same route.fields — was filled in with),
     * never from AppViewer's own query string/body. This is what lets a
     * Page action that reads `$request->query`/`body`/`params` behave
     * correctly here: it sees the values typed into the panel, not
     * AppViewer's own `?controller=&action=` plumbing.
     */
    private static function buildTargetRequest(Request $incoming, array $route): Request
    {
        $payload = $incoming->body->all();

        $target = new Request(
            query: is_array($payload['query'] ?? null) ? $payload['query'] : [],
            body: is_array($payload['body'] ?? null) ? $payload['body'] : [],
            method: $route['method'],
            path: $route['path'],
        );
        $target->params = new InputBag(is_array($payload['params'] ?? null) ? $payload['params'] : []);

        return $target;
    }

    private static function invokePage(Container $container, string $controllerClass, string $action, Request $request): Page
    {
        $controller = $container->make($controllerClass);
        $result = $controller->$action($request);

        if (!$result instanceof Page) {
            // Only reachable if the same method's return type changed
            // between routes() being compiled/cached and this request —
            // resolveTarget() already guarantees it currently declares
            // Page.
            throw new PacketFailed("$controllerClass::$action() did not return a Page", 0, 500);
        }

        return $result;
    }

    /**
     * Page::isReturnedBy() (generic, framework-level, no app-specific
     * knowledge) — reliable on its own now that RouteCompiler enforces
     * the split at compile time: a #[PageController] action always
     * declares Page, a #[RestController] action never does (see
     * RouteCompiler::assertReturnType()), so this can't disagree with
     * which attribute a route's controller actually carries.
     * Tester\TesterController uses this exact same check (inverted —
     * to exclude, not include) to keep its own list to JSON/API routes
     * only.
     */
    private static function returnsPage(string $controllerClass, string $action): bool
    {
        return Page::isReturnedBy($controllerClass, $action);
    }

    /** @param array{method: string, path: string, prefix: string, comment: string|null, controller: string, action: string, fields: array, middleware: array} $route */
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
            // The real FQCN + method name — needed by render() above to
            // actually re-invoke the right thing; Tester's own
            // list never needs to expose this since it never
            // re-instantiates anything itself, the browser just fetches
            // the real URL.
            'controllerClass' => $route['controller'],
            'action' => $route['action'],
            // Same InputBag-detected field metadata Tester's list
            // carries (see RouteCompiler::fieldsOf()) — drives the UI's
            // Request panel, one labeled input per query/body field a
            // Page action actually validates.
            'fields' => $route['fields'],
            'middleware' => array_map(
                static fn (array $mw): string => $mw['class'],
                $route['middleware'],
            ),
        ];
    }
}
