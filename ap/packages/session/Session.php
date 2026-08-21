<?php

declare(strict_types=1);

namespace Session;

use ApiPro\Packet;

/**
 * A stateless, JWT-style session — not native $_SESSION. One Session
 * instance is shared for the lifetime of a request (bound as a singleton
 * by SessionModule), holding at most one "current" SessionToken: whatever
 * resolve() last accepted, or whatever create() last issued.
 */
class Session
{
    private ?SessionToken $current = null;

    public function __construct(
        private readonly SessionConfig $config,
        private readonly SessionCodec $codec,
    ) {
    }

    /**
     * Session::create($id, $data) — issues a brand-new token and makes it
     * the current one, so a later response() call encodes and attaches it.
     * This is also how a session gets refreshed: call it again (e.g. with
     * the same $id) and a new token — with a new random encKey, when `enc`
     * is on — replaces whatever was current before.
     *
     * @param array<string, mixed> $data
     */
    public function create(string $id, array $data = []): SessionToken
    {
        $now = time();

        return $this->current = new SessionToken(
            id: $id,
            createdAt: $now,
            expireAt: $now + $this->config->ttl,
            version: $this->config->version,
            data: $data,
            encKey: $this->config->enc ? $this->randomEncKey() : null,
        );
    }

    /** A fresh random 10-digit numeric key, generated every create()/refresh — never reused. */
    private function randomEncKey(): string
    {
        return str_pad((string) random_int(0, 9_999_999_999), 10, '0', STR_PAD_LEFT);
    }

    /**
     * Decodes + verifies a compact token string (from a bearer header or
     * cookie). Returns null — and clears any current token — for anything
     * that doesn't check out: bad signature, malformed payload, a version
     * that no longer matches (e.g. config version was bumped to invalidate
     * every existing token at once), a token past expire_at, or a failed
     * decrypt when `enc` is on. No distinction is made between those
     * cases — nor between this being used to verify a primary or a refresh
     * token — they all just come back as "not a valid session".
     */
    public function resolve(string $token): ?SessionToken
    {
        $decoded = $this->codec->decode($token);

        if ($decoded === null || $decoded->isExpired() || $decoded->version !== $this->config->version) {
            $this->current = null;

            return null;
        }

        return $this->current = $decoded;
    }

    public function current(): ?SessionToken
    {
        return $this->current;
    }

    /**
     * Session::response($packet) — merges the packet's data into the
     * current token, encodes it (encrypted into `enc` if config `enc` is
     * on), and returns the same packet with that token attached via
     * Packet::with('token', ...) — still just a Packet, the only shape
     * Response::json() accepts.
     *
     * If there's no current token (nothing was ever created/resolved this
     * request), the packet is returned as-is with no token — a route that
     * never needed a session at all shouldn't be forced to carry one. But
     * if there IS a current token and encoding it comes back empty (e.g.
     * the encryption round-trip itself failed), that's treated exactly
     * like an expired token rather than ever emitting a broken response.
     */
    public function response(Packet $packet): Packet
    {
        if ($this->current === null) {
            return $packet;
        }

        $this->current->data = [...$this->current->data, ...(array) $packet->data()];

        $token = $this->codec->encode($this->current);

        if ($token === null || $token === '') {
            return (new Packet())->failed('Token expired');
        }

        return $packet->with('token', $token);
    }

    /**
     * Session::logout() — drops the current token. Since a JWT-style
     * session is stateless, this can't force an already-issued token to
     * stop working server-side; it only means response() won't hand the
     * client anything to keep reusing. To invalidate every outstanding
     * token at once (e.g. on a security incident), bump SESSION_VERSION
     * in .env instead — resolve() rejects any older version.
     */
    public function logout(): void
    {
        $this->current = null;
    }
}
