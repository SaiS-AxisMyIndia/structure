<?php

declare(strict_types=1);

namespace ApiPro;

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

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $path = parse_url($uri, PHP_URL_PATH) ?: '/';
        $this->path = $path === '/' ? '/' : rtrim($path, '/');

        $this->query = new InputBag($_GET);

        $raw = file_get_contents('php://input') ?: '';
        $decoded = json_decode($raw, true);
        $this->body = new InputBag(is_array($decoded) ? $decoded : $_POST);

        $this->params = new InputBag([]);
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $this->query[$key] ?? $default;
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

    public function cookie(string $name): ?string
    {
        return $_COOKIE[$name] ?? null;
    }
}
