<?php

declare(strict_types=1);

namespace Gerogo;

/**
 * Wraps the incoming HTTP request, roughly equivalent to Spring's
 * HttpServletRequest but reduced to what a JSON API needs. `query`,
 * `body`, and `params` are InputBag — validated, typed getters, but still
 * usable as plain arrays (`$request->params['id']`).
 */
class Request
{
    public readonly string $method;
    public readonly string $path;

    public readonly InputBag $query;
    public readonly InputBag $body;

    /** Route placeholders, e.g. {id} — set by Router once a route matches. */
    public InputBag $params;

    /**
     * Whether the route that matched this request is a #[PageController]
     * one — set by Router alongside $params, the moment a route matches.
     * For a request that never matches any route at all (a genuine
     * 404), Router falls back to Accept-header content negotiation
     * instead — see wantsHtml() and Router::dispatch()'s own comment.
     * Kernel::handle() reads this to decide how to render a caught
     * failure: a styled HTML error page (Page::failed()) for a Page
     * route, the usual JSON Packet for everything else — see its own
     * comment.
     */
    public bool $isPage = false;

    /**
     * Every argument defaults to reading the real incoming request, same
     * as before this constructor took any — Kernel's own `new Request()`
     * (no arguments) is untouched by this. The overrides exist so a
     * caller that ISN'T handling a real HTTP request can still build one:
     * AppViewer synthesizes a Request carrying whatever query/body/path-
     * param values its UI's Request panel was filled in with, so a Page
     * action reading `$request->query`/`body`/`params` sees exactly
     * that, not whatever AppViewer's own `/app-viewer/render` request
     * happened to carry.
     *
     * @param array<string, mixed>|null $query overrides $_GET when given
     * @param array<string, mixed>|null $body overrides the real request body when given — skips reading php://input entirely
     */
    public function __construct(?array $query = null, ?array $body = null, ?string $method = null, ?string $path = null)
    {
        $this->method = strtoupper($method ?? $_SERVER['REQUEST_METHOD'] ?? 'GET');

        if ($path !== null) {
            $this->path = $path;
        } else {
            // Exact, no trailing-slash leniency on purpose: stripping a
            // trailing slash here would make "/api/users/" (a genuinely
            // empty {id}) collide with "/api/users" (index()'s own
            // route) before routing even sees it — silently matching the
            // WRONG route instead of the intended one with a blank
            // param. RouteCompiler's regex allows an empty final segment
            // through instead, so a request like that still reaches the
            // right controller action, where InputBag's own
            // getInt('id')/getString(...) reports the real "'id' is
            // required."/"must be an integer." 400 — not a silently
            // wrong 200.
            $uri = $_SERVER['REQUEST_URI'] ?? '/';
            $this->path = parse_url($uri, PHP_URL_PATH) ?: '/';
        }

        $this->query = new InputBag($query ?? $_GET);

        if ($body !== null) {
            $this->body = new InputBag($body);
        } else {
            $raw = file_get_contents('php://input') ?: '';
            $decoded = json_decode($raw, true);
            $this->body = new InputBag(is_array($decoded) ? $decoded : $_POST);
        }

        $this->params = new InputBag([]);
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $this->query[$key] ?? $default;
    }

    /**
     * The whole request, as one plain array — `{query: {...}, body:
     * {...}, params: {...}}` — every source kept separate rather than
     * merged into one flat bag (a query field and a path param could
     * otherwise share a name and silently collide). For anything that
     * wants the entire request as one JSON-able value instead of reading
     * `$request->query`/`body`/`params` individually — e.g. AppViewer
     * echoing back exactly what a synthetic Request was built with.
     *
     * @return array{query: array<string, mixed>, body: array<string, mixed>, params: array<string, mixed>}
     */
    public function all(): array
    {
        return [
            'query' => $this->query->all(),
            'body' => $this->body->all(),
            'params' => $this->params->all(),
        ];
    }

    public function header(string $name): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));

        return $_SERVER[$key] ?? null;
    }

    /** The token from an `Authorization: Bearer <token>` header, if present. */
    public function bearerToken(): ?string
    {
        $header = $this->header('Authorization');

        if ($header !== null && str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        return null;
    }

    /**
     * Whether the client's own `Accept` header prefers HTML over JSON —
     * true for a real browser's top-level navigation (which always
     * sends `Accept: text/html,...` first), false for a plain XHR/fetch
     * call or `curl` (a wildcard Accept, unless it explicitly asked for
     * HTML too). Used by Router::dispatch() for the one case `$isPage` can
     * never cover: a path that matches NO route at all — there's no
     * compiled route left to read `isPage` from at that point, so this
     * is the only signal left for "was this browser navigation probably
     * headed for a Page anyway" (see its own comment).
     */
    public function wantsHtml(): bool
    {
        return str_contains($this->header('Accept') ?? '', 'text/html');
    }

    public function cookie(string $name): ?string
    {
        return $_COOKIE[$name] ?? null;
    }
}
