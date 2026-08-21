<?php

declare(strict_types=1);

namespace ApiPro;

/**
 * A pipeline stage the Router runs around a controller action, equivalent
 * to a Spring HandlerInterceptor/servlet Filter: call $next($request) to
 * continue the chain (and to reach the controller itself at the innermost
 * layer), or short-circuit by returning without calling it.
 */
interface MiddlewareInterface
{
    /**
     * @param callable(Request): mixed $next
     */
    public function handle(Request $request, callable $next): mixed;
}
