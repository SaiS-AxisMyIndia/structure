<?php

declare(strict_types=1);

namespace ProSql;

/**
 * Dependency-free RFC 4122 UUID generators — versions 4 (random) and 6
 * (time-ordered) — exactly what a #[Primary('uuid', version: 4|6)]
 * column (see Attributes\Primary/PrimaryType) needs a value from before
 * insert, since nothing supplies one automatically: the column's own
 * DEFAULT (...) (see EntityScanner::primaryColumn() /
 * DdlGenerator::uuidDefaultExpression()) is only a backstop for an
 * insert path that bypasses the ORM entirely — MySQL has no RETURNING
 * clause, so the application still has to generate the real one itself
 * to ever find out what it was. See ProRepo::newPrimaryKey() for where
 * a repo actually calls one of these.
 */
final class Uuid
{
    public static function v4(): string
    {
        $bytes = random_bytes(16);

        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40); // version 4
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80); // variant 10xx

        $hex = bin2hex($bytes);

        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hex, 0, 8),
            substr($hex, 8, 4),
            substr($hex, 12, 4),
            substr($hex, 16, 4),
            substr($hex, 20, 12),
        );
    }

    /**
     * Sorts the same as creation order (like an auto-increment id),
     * unlike v4 — the tradeoff is the creation timestamp is embedded
     * (and readable) in the id itself. The 60-bit timestamp here is
     * microseconds since the Unix epoch, same convention
     * DdlGenerator::uuidDefaultExpression()'s NOW(6)-based SQL uses —
     * not RFC 9562's own Gregorian epoch, since nothing here needs to
     * decode a v6 id's timestamp back out, only generate ids that sort
     * correctly relative to each other.
     */
    public static function v6(): string
    {
        $microseconds = (int) round(microtime(true) * 1_000_000) & ((1 << 60) - 1);
        $timeHex = str_pad(dechex($microseconds), 15, '0', STR_PAD_LEFT);

        $tail = random_bytes(8);
        $tail[0] = chr((ord($tail[0]) & 0x3f) | 0x80); // variant 10xx
        $tailHex = bin2hex($tail);

        return sprintf(
            '%s-%s-6%s-%s-%s',
            substr($timeHex, 0, 8),
            substr($timeHex, 8, 4),
            substr($timeHex, 12, 3),
            substr($tailHex, 0, 4),
            substr($tailHex, 4, 12),
        );
    }
}
