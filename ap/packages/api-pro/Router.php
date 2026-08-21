<?php

declare(strict_types=1);

namespace ApiPro;

/**
 * Matches an incoming request against a precompiled route table and
 * dispatches it through the route's middleware chain to the matching
 * controller method — the piece that plays the role of Spring MVC's
 * DispatcherServlet plus its interceptor chain.
 *
 * Router itself does no Reflection and knows nothing about attributes —
 * that work happens once, in RouteCompiler, normally driven by
 * Runner::routes() (which can cache the result to a file). Router just
 * takes the compiled table and calls the matching method directly.
 */
class Router
{
    /**
     * @var array<string, list<array{
     *     regex: string,
     *     controller: class-string,
     *     action: string,
     *     path: string,
     *     middleware: list<array{class: class-string, overrides: array<string, mixed>}>,
     * }>>
     */
    private array $routes = [];

    /**
     * @param list<array{method: string, regex: string, controller: class-string, action: string, path: string, middleware: array}> $compiledRoutes
     */
    public function __construct(private readonly Container $container, array $compiledRoutes = [])
    {
        $this->addRoutes($compiledRoutes);
    }

    /**
     * Merges an already-compiled route table (from RouteCompiler::compile(),
     * or Runner's cache file) into what this Router already knows —
     * grouped by HTTP method for fast lookup at dispatch time.
     *
     * @param list<array{method: string, regex: string, controller: class-string, action: string, path: string, middleware: array}> $compiledRoutes
     */
    public function addRoutes(array $compiledRoutes): void
    {
        foreach ($compiledRoutes as $route) {
            $this->routes[$route['method']][] = $route;
        }
    }

    /** Convenience for a single controller with no precompiled table to hand in — compiles it on the spot. */
    public function registerController(string $controllerClass, string $modulePrefix = ''): void
    {
        $this->addRoutes(RouteCompiler::compile($controllerClass, $modulePrefix));
    }

    public function dispatch(Request $request): mixed
    {
        foreach ($this->routes[$request->method] ?? [] as $route) {
            if (preg_match($route['regex'], $request->path, $matches) === 1) {
                $request->params = new InputBag(array_filter(
                    $matches,
                    static fn (int|string $key): bool => is_string($key),
                    ARRAY_FILTER_USE_KEY,
                ));

                $action = fn (Request $request): mixed => $this->container
                    ->make($route['controller'])
                    ->{$route['action']}($request);

                return $this->runPipeline($route['middleware'], $request, $action);
            }
        }

        throw new PacketFailed('Not Found', 404, ['path' => $request->path]);
    }

    /**
     * Wraps $destination (the controller action) in each middleware, outermost
     * first, so calling the resulting closure runs: mw[0] -> mw[1] -> ... ->
     * destination -> back out through every middleware in reverse. Each
     * middleware decides whether/when to call $next — the same onion model
     * as Spring's interceptor chain or a PSR-15 pipeline.
     *
     * @param list<array{class: class-string, overrides: array<string, mixed>}> $middlewareEntries
     */
    private function runPipeline(array $middlewareEntries, Request $request, callable $destination): mixed
    {
        $pipeline = array_reduce(
            array_reverse($middlewareEntries),
            fn (callable $next, array $entry): callable => function (Request $request) use ($entry, $next): mixed {
                // overrides were already lifted out of any attribute-built
                // instance at compile time (RouteCompiler) — no reflection
                // happens here, just build-with-overrides or build-plain.
                $middleware = $entry['overrides'] === []
                    ? $this->container->make($entry['class'])
                    : $this->container->makeWith($entry['class'], $entry['overrides']);

                return $middleware->handle($request, $next);
            },
            $destination,
        );

        return $pipeline($request);
    }
}
