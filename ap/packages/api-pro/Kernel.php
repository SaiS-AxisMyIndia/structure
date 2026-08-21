<?php

declare(strict_types=1);

namespace ApiPro;

/**
 * The application bootstrap, equivalent to Spring Boot's SpringApplication:
 * builds the container, registers every module Runner already resolved,
 * builds the Router from the route table Runner already compiled, and
 * dispatches the request.
 *
 * Kernel::boot() assumes Runner::boot() already ran (runner.php does this
 * before Kernel::boot() is ever called) — it reads Runner::modules() and
 * Runner::routes() rather than resolving/compiling either itself, so
 * booting the Kernel never re-does work Runner already did.
 */
class Kernel
{
    public readonly Container $container;
    public readonly Router $router;

    /** @param array<string, mixed> $config */
    private function __construct(private readonly array $config)
    {
        $this->container = new Container();
        $this->router = new Router($this->container, Runner::routes());
    }

    /** @param array<string, mixed> $config */
    public static function boot(array $config): self
    {
        $kernel = new self($config);
        $kernel->registerModules();

        return $kernel;
    }

    private function registerModules(): void
    {
        // Every module is already resolved (see Runner::modules()) — this
        // just binds each one's services into this request's container.
        // Endpoints themselves are not registered here: the Router above
        // was already built from Runner::routes(), the fully compiled
        // table, so dispatch() can call the matching method directly
        // without re-checking any controller's attributes.
        foreach (Runner::modules() as $module) {
            $module->register($this->container);
        }
    }

    public function handle(): void
    {
        $request = new Request();
        $result = $this->router->dispatch($request);

        // dispatch() only returns when a route handler didn't already send
        // its own response (e.g. Response::json()/Page::send() inside the
        // controller). A returned Page is rendered and sent as HTML; a
        // Packet is passed through as-is; anything else is wrapped in one
        // — Response::json() only ever accepts a Packet.
        if ($result instanceof Page) {
            Response::html($result->render());
        }

        Response::json($result instanceof Packet ? $result : (new Packet())->success($result));
    }

    public function name(): string
    {
        return $this->config['name'] ?? 'application';
    }

    public function version(): string
    {
        return $this->config['version'] ?? '0.0.0';
    }

    public function env(): string
    {
        return $this->config['env'] ?? 'production';
    }
}
