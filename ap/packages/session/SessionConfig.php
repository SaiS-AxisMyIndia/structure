<?php

declare(strict_types=1);

namespace Session;

/**
 * Typed session/JWT config, built by SessionModule from SESSION_*
 * environment variables — equivalent to Spring Security's jwt.secret /
 * jwt.expiration properties. `enc` gates whether a token's data is
 * encrypted on the wire (default false).
 */
final class SessionConfig
{
    public function __construct(
        public readonly string $secret,
        public readonly int $ttl,
        public readonly int $refreshTtl,
        public readonly int $version,
        public readonly bool $enc,
    ) {
    }

    /**
     * @param array{
     *     secret: string,
     *     ttl?: int,
     *     refresh_ttl?: int,
     *     version?: int,
     *     enc?: bool,
     * } $config
     */
    public static function fromArray(array $config): self
    {
        return new self(
            secret: $config['secret'],
            ttl: $config['ttl'] ?? 3600,
            refreshTtl: $config['refresh_ttl'] ?? 1_209_600,
            version: $config['version'] ?? 1,
            enc: $config['enc'] ?? false,
        );
    }
}
