<?php

declare(strict_types=1);

namespace Gerogo;

use ReflectionClass;
use ReflectionNamedType;
use RuntimeException;

/**
 * Minimal dependency-injection container. Resolves constructor parameters
 * by type-hint automatically (constructor autowiring), the same behaviour
 * Spring gives you for free when a bean has a single constructor.
 */
class Container
{
    /** @var array<string, callable|string> */
    private array $bindings = [];

    /** @var array<string, object|null> */
    private array $singletons = [];

    public function bind(string $abstract, callable|string|null $concrete = null): void
    {
        $this->bindings[$abstract] = $concrete ?? $abstract;
    }

    public function singleton(string $abstract, callable|string|null $concrete = null): void
    {
        $this->bind($abstract, $concrete);
        $this->singletons[$abstract] = null;
    }

    public function has(string $abstract): bool
    {
        return isset($this->bindings[$abstract]) || class_exists($abstract);
    }

    public function make(string $abstract): object
    {
        if (array_key_exists($abstract, $this->singletons) && $this->singletons[$abstract] !== null) {
            return $this->singletons[$abstract];
        }

        $concrete = $this->bindings[$abstract] ?? $abstract;

        $instance = (is_string($concrete) && class_exists($concrete))
            ? $this->build($concrete)
            : $concrete($this);

        if (array_key_exists($abstract, $this->singletons)) {
            $this->singletons[$abstract] = $instance;
        }

        return $instance;
    }

    /**
     * Like make(), but for named constructor parameters present in
     * $parameters, use that value instead of autowiring/defaulting —
     * everything else (service dependencies, unmentioned defaults) still
     * resolves normally. Always builds fresh; never touches bindings or
     * singletons, since a specific parameter override implies "give me
     * this exact configuration", not "give me the shared instance".
     *
     * @param array<string, mixed> $parameters
     */
    public function makeWith(string $class, array $parameters = []): object
    {
        return $this->build($class, $parameters);
    }

    /** @param array<string, mixed> $parameters */
    private function build(string $class, array $parameters = []): object
    {
        if (!class_exists($class)) {
            throw new RuntimeException("Cannot resolve unknown class [$class].");
        }

        $reflector = new ReflectionClass($class);
        $constructor = $reflector->getConstructor();

        if ($constructor === null) {
            return new $class();
        }

        $arguments = [];

        foreach ($constructor->getParameters() as $parameter) {
            $name = $parameter->getName();

            if (array_key_exists($name, $parameters)) {
                $arguments[] = $parameters[$name];
                continue;
            }

            $type = $parameter->getType();

            if ($type instanceof ReflectionNamedType && !$type->isBuiltin()) {
                $arguments[] = $this->make($type->getName());
                continue;
            }

            if ($parameter->isDefaultValueAvailable()) {
                $arguments[] = $parameter->getDefaultValue();
                continue;
            }

            throw new RuntimeException(
                "Cannot resolve parameter [\${$parameter->getName()}] when building [$class]."
            );
        }

        return $reflector->newInstanceArgs($arguments);
    }
}
