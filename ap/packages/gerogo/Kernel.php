<?php

declare(strict_types=1);

namespace Gerogo;

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
        // Self-registered so any class the container builds can ask for
        // Container $container in its own constructor and get back THIS
        // one — the real, already-module-configured instance — instead
        // of Container::make() naively autowiring a brand-new, empty one
        // (Container has no constructor args, so that would otherwise
        // "succeed" silently with something useless). Needed by anything
        // that has to build another class dynamically at runtime, by
        // name, outside the normal Router::dispatch() flow — e.g.
        // AppViewer re-invoking a specific Page-returning controller
        // action on demand.
        $this->container->singleton(Container::class, fn (): Container => $this->container);
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

        // A thrown PacketFailed (from a controller, a middleware, InputBag's
        // own validation, Router's "not found" fallback — anywhere) is
        // caught here, once, and converted — the "auto convert" half of
        // PacketFailed/PacketSuccess: nothing in between ever needs to
        // call Response::json() itself. Its httpStatus() (200 unless the
        // caller set otherwise) becomes the real response status;
        // errorCode() is a body-level detail toPacket() already carries
        // (see Packet), not a transport-layer one.
        //
        // $request->isPage (set by Router the moment a route matches —
        // still false if the route never matched at all, e.g. a 404)
        // decides HTML vs JSON here: a #[PageController] route failing
        // — a validation error, an expired session, anything throwing
        // PacketFailed or otherwise — renders as a styled error page
        // (Page::failed()) a browser can actually show, not a raw JSON
        // body a visitor would otherwise see verbatim.
        try {
            $result = $this->router->dispatch($request);
        } catch (PacketFailed $failure) {
            if ($request->isPage) {
                Response::html(Page::failed($failure->httpStatus(), $failure->getMessage())->render(), $failure->httpStatus());
            }

            Response::json($failure->toPacket(), $failure->httpStatus());
        } catch (\Throwable $e) {
            // Anything else escaping all the way up here is a genuine
            // bug or infrastructure failure (a database that's
            // unreachable, for instance) — never let it fall through to
            // PHP's own raw HTML stack-trace dump. That's both an
            // information leak (real file paths/line numbers handed to
            // whoever's calling the API) and simply not JSON, breaking
            // every client that expects one. The message itself is only
            // included outside `env: local` when it's already safe to
            // show — see PacketFailed for the same idea applied
            // deliberately instead of by omission.
            //
            // Logged either way (see Log::crash()) — a request-time
            // crash matters just as much as CrashPage's boot-time one,
            // and both write to the same prologs.log.
            Log::crash($e);
            $message = $this->env() === 'local' ? $e->getMessage() : 'Internal server error';

            if ($request->isPage) {
                Response::html(Page::failed(500, $message)->render(), 500);
            }

            Response::json((new Packet())->failed($message), 500);
        }

        // dispatch() only returns when a route handler didn't already send
        // its own response (e.g. Response::html()/Page::send() inside the
        // controller). A returned Page is rendered and sent as HTML; a
        // Packet (including a PacketSuccess) is passed through as-is;
        // anything else is wrapped in one — Response::json() only ever
        // accepts a Packet. Either way, the Packet's own httpStatus()
        // (200 by default) decides the real response status.
        if ($result instanceof Page) {
            Response::html($result->render());
        }

        // A PacketFailed doesn't have to be thrown — a controller can
        // `return` one too (e.g. when its own return type already covers
        // PacketFailed alongside Packet/array). toPacket() already
        // carries its errorCode/httpStatus over faithfully, so once it's
        // a Packet, the rest is identical to the plain-Packet/array cases
        // below — one httpStatus() read decides the real response status
        // either way.
        $packet = match (true) {
            $result instanceof PacketFailed => $result->toPacket(),
            $result instanceof Packet => $result,
            default => (new Packet())->success($result),
        };

        Response::json($packet, $packet->httpStatus());
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
