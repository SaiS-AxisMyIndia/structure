<?php

declare(strict_types=1);

namespace ApiPro;

/**
 * A registration unit for an application package (e.g. api-pro), equivalent
 * to a Spring Boot auto-configuration class: it binds services into the
 * container and declares which controllers should be wired into the router.
 */
abstract class Module
{
    /** @return list<class-string> Controller classes this module contributes. */
    abstract public function controllers(): array;

    /** Override to bind services/repositories/config into the container. */
    public function register(Container $container): void
    {
    }

    /**
     * Override to prepend a base path to every controller this module
     * contributes — equivalent to Spring's server.servlet.context-path,
     * but scoped to one module instead of the whole app. Each controller
     * still declares its own #[RestController(prefix: ...)] on top of this.
     */
    public function prefix(): string
    {
        return '';
    }

    /**
     * Registers this module's controllers directly on a Router. Kernel
     * doesn't call this anymore — it builds the Router from Runner::routes()
     * (every module's controllers, already compiled by RouteCompiler) — but
     * it's here for anything that wants to wire a single module onto a
     * Router without going through Runner at all (e.g. a focused test).
     */
    public function routes(Router $router): void
    {
        foreach ($this->controllers() as $controllerClass) {
            $router->registerController($controllerClass, $this->prefix());
        }
    }
}
