<?php

declare(strict_types=1);

namespace ApiPro;

use ApiPro\Attributes\BaseRoot;
use ReflectionClass;

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
     * The base path prepended to every controller this module
     * contributes — equivalent to Spring's server.servlet.context-path,
     * but scoped to one module instead of the whole app. Each controller
     * still declares its own #[RestController(prefix: ...)] on top of this.
     *
     * Reads #[BaseRoot('/some/prefix')] off the concrete subclass by
     * default (see App\Application for an example) — no attribute means
     * no prefix. Override this method directly instead if a prefix
     * needs to be computed at runtime rather than declared as a fixed
     * string; a method override always takes priority over this default,
     * the normal way inheritance works.
     */
    public function prefix(): string
    {
        $attributes = (new ReflectionClass($this))->getAttributes(BaseRoot::class);

        return $attributes === [] ? '' : $attributes[0]->newInstance()->prefix;
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

    /**
     * Override to run this module's own part of `apc build` — anything
     * beyond the route compiling BuildCommand already does for every
     * module generically via Runner::warmRoutes(). Called once per
     * module (in Runner::modules() order) after routes are built; return
     * a short summary line to print (e.g. "3 table(s) created"), or null
     * to print nothing. Most modules have nothing to do here and never
     * override this at all — api-pro deliberately has no idea what, if
     * anything, a given module does with it (e.g. pro-sql's
     * ProSqlModule uses it to sync entity tables — see its docblock —
     * without api-pro ever needing to depend on pro-sql to make that
     * possible).
     */
    public function build(): ?string
    {
        return null;
    }

    /**
     * Override to contribute this module's own runner/<name>.php
     * file(s) — what `apc build --clean` writes when regenerating the
     * whole runner/ directory from scratch. Most modules have nothing
     * to do here and never override this at all: api-pro deliberately
     * doesn't know pro-sql's DB_* env vars, session's SESSION_* ones,
     * or any other module's config shape — the same "generic hook,
     * each module fills in its own piece" pattern build() already
     * uses, just for a file to write instead of a build-step summary
     * to print.
     *
     * @return array<string, string> filename (e.g. "prosql.php") => full PHP source to write to runner/<filename>
     */
    public function runnerTemplate(): array
    {
        return [];
    }
}
