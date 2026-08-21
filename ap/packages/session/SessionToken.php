<?php

declare(strict_types=1);

namespace Session;

/**
 * The decoded shape of a session — id / created_at / expire_at / version,
 * plus whatever payload data it carries. Whether that data travels on the
 * wire as a plain `data` field or an encrypted `enc` field is a
 * SessionCodec/config concern, not this object's — in memory it's always
 * just a plain array.
 *
 * `encKey` is only set when `enc` is on: a random 10-digit key generated
 * fresh by Session::create() every time a session is issued (or
 * re-issued/refreshed), mixed with the app secret to derive that one
 * token's AES key — see SessionCodec. It's carried in cleartext on the
 * wire (it's a diversifier, not a secret by itself) and round-trips
 * through decode() so re-encoding the same token reuses it rather than
 * silently rotating on every response().
 */
final class SessionToken
{
    public function __construct(
        public readonly string $id,
        public readonly int $createdAt,
        public readonly int $expireAt,
        public readonly int $version,
        /** @var array<string, mixed> */
        public array $data = [],
        public readonly ?string $encKey = null,
    ) {
    }

    public function isExpired(): bool
    {
        return $this->expireAt < time();
    }
}
