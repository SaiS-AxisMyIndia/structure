<?php

declare(strict_types=1);

namespace Session;

use Gerogo\Packet;
use Gerogo\PacketFailed;

/**
 * A stateless, JWT-style session — not native $_SESSION. One Session
 * instance is shared for the lifetime of a request (bound as a singleton
 * by SessionModule), holding at most one "current" access SessionToken
 * (whatever resolve() last accepted, or create() last issued) and at most
 * one "current" refresh SessionToken (whatever createRefresh() last
 * issued this request).
 *
 * Only a token this request actually *issued* — via create()/createRefresh()
 * — travels back out in response(). Merely resolving an incoming token
 * (the normal case on every other protected endpoint) authenticates the
 * request but does NOT cause it to be re-attached to the response — that's
 * what used to make every response carry a `token`, not just login/refresh.
 */
class Session
{
    private ?SessionToken $current = null;
    private bool $currentIssued = false;

    private ?SessionToken $currentRefresh = null;
    private bool $refreshIssued = false;

    public function __construct(
        private readonly SessionConfig $config,
        private readonly SessionCodec $codec,
    ) {
    }

    /**
     * Session::create($id, $data) — issues a brand-new access token and
     * makes it the current one, so a later response() call encodes and
     * attaches it. This is also how a session gets refreshed: call it
     * again (e.g. with the same $id) and a new token — with a new random
     * encKey, when `enc` is on — replaces whatever was current before.
     *
     * @param array<string, mixed> $data
     */
    public function create(string $id, array $data = []): SessionToken
    {
        $now = time();
        $this->currentIssued = true;

        return $this->current = new SessionToken(
            id: $id,
            createdAt: $now,
            expireAt: $now + $this->config->ttl,
            version: $this->config->version,
            data: $data,
            encKey: $this->config->enc ? $this->randomEncKey() : null,
            kind: 'access',
        );
    }

    /**
     * Session::createRefresh($id, $data) — issues a brand-new refresh
     * token (ttl = config's refresh_ttl, kind = 'refresh') and makes it
     * the current refresh token, so response() attaches it as
     * `refresh_token`. Call alongside create() at login, and again inside
     * the /auth/refresh handler to rotate it.
     *
     * @param array<string, mixed> $data
     */
    public function createRefresh(string $id, array $data = []): SessionToken
    {
        $now = time();
        $this->refreshIssued = true;

        return $this->currentRefresh = new SessionToken(
            id: $id,
            createdAt: $now,
            expireAt: $now + $this->config->refreshTtl,
            version: $this->config->version,
            data: $data,
            encKey: $this->config->enc ? $this->randomEncKey() : null,
            kind: 'refresh',
        );
    }

    /** A fresh random 10-digit numeric key, generated every create()/refresh — never reused. */
    private function randomEncKey(): string
    {
        return str_pad((string) random_int(0, 9_999_999_999), 10, '0', STR_PAD_LEFT);
    }

    /**
     * Decodes + verifies a compact token string (from a bearer header or
     * cookie) as an ACCESS token. Returns null — and clears any current
     * token — for anything that doesn't check out: bad signature,
     * malformed payload, a version that no longer matches (e.g. config
     * version was bumped to invalidate every existing token at once), a
     * token past expire_at, a failed decrypt when `enc` is on, or a token
     * that decodes fine but is actually a refresh token (`kind !==
     * 'access'`) — a refresh token can't be replayed as a bearer token.
     * None of these cases are distinguished further — they all just come
     * back as "not a valid session".
     *
     * Note: a successful resolve() authenticates the request but does NOT
     * by itself cause response() to hand a token back out — only
     * create() does that. See the class docblock.
     */
    public function resolve(string $token): ?SessionToken
    {
        $decoded = $this->codec->decode($token);

        if (
            $decoded === null
            || $decoded->isExpired()
            || $decoded->version !== $this->config->version
            || $decoded->kind !== 'access'
        ) {
            $this->current = null;

            return null;
        }

        return $this->current = $decoded;
    }

    /**
     * Decodes + verifies a compact token string as a REFRESH token — the
     * counterpart to resolve(), used by the /auth/refresh handler.
     * Deliberately does NOT touch $this->current/$currentRefresh: a
     * refresh call decides for itself (via create()/createRefresh()) what
     * the response carries, rather than inheriting whatever state a prior
     * resolve() left behind.
     */
    public function resolveRefresh(string $token): ?SessionToken
    {
        $decoded = $this->codec->decode($token);

        if (
            $decoded === null
            || $decoded->isExpired()
            || $decoded->version !== $this->config->version
            || $decoded->kind !== 'refresh'
        ) {
            return null;
        }

        return $decoded;
    }

    public function current(): ?SessionToken
    {
        return $this->current;
    }

    /**
     * Session::response($packet) — attaches `token` when this request
     * issued a fresh access token (via create()), and `refresh_token`
     * when it issued a fresh refresh token (via createRefresh()). A
     * request that only resolve()d an existing token — the normal case on
     * every protected endpoint other than login/refresh — attaches
     * neither: the packet comes back exactly as the controller made it.
     *
     * When an access token IS being attached, the packet's data is merged
     * into it first, so whatever the controller returned rides along
     * inside the token's payload for the next resolve() to see again.
     *
     * If a token was issued but encoding it comes back empty (e.g. the
     * encryption round-trip itself failed), that's a real server-side
     * failure — thrown as a PacketFailed(500) rather than ever silently
     * emitting a 200 response with a token missing.
     */
    public function response(Packet $packet): Packet
    {
        if ($this->currentIssued && $this->current !== null) {
            $this->current->data = [...$this->current->data, ...(array) $packet->data()];

            $token = $this->codec->encode($this->current);

            if ($token === null || $token === '') {
                throw new PacketFailed('Failed to encode session token', 0, 500);
            }

            $packet = $packet->with('token', $token);
        }

        if ($this->refreshIssued && $this->currentRefresh !== null) {
            $refreshToken = $this->codec->encode($this->currentRefresh);

            if ($refreshToken === null || $refreshToken === '') {
                throw new PacketFailed('Failed to encode refresh token', 0, 500);
            }

            $packet = $packet->with('refresh_token', $refreshToken);
        }

        return $packet;
    }

    /**
     * Session::logout() — drops the current access + refresh tokens.
     * Since a JWT-style session is stateless, this can't force an
     * already-issued token to stop working server-side; it only means
     * response() won't hand the client anything to keep reusing. To
     * invalidate every outstanding token at once (e.g. on a security
     * incident), bump SESSION_VERSION in .env instead — resolve() /
     * resolveRefresh() reject any older version.
     */
    public function logout(): void
    {
        $this->current = null;
        $this->currentIssued = false;
        $this->currentRefresh = null;
        $this->refreshIssued = false;
    }
}
