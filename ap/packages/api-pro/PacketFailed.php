<?php

declare(strict_types=1);

namespace ApiPro;

use RuntimeException;

/**
 * The "failed" half of Packet, made throwable — throw this from anywhere
 * (a controller, a middleware, InputBag's own validation, the router's
 * "not found" fallback) to fail a request with a real HTTP status and a
 * `{success:false,...}` body, without ever writing Response::json()
 * yourself:
 *
 *   if ($user === null) {
 *       throw new PacketFailed('User not found', 404);
 *   }
 *
 * Kernel::handle() catches PacketFailed in exactly one place and converts
 * it — same as returning a plain value auto-wraps into a success Packet,
 * throwing this auto-wraps into a failed one. It propagates through any
 * number of middleware layers on its own (it's a real exception), so
 * nothing in between needs to catch/rethrow/care.
 *
 * See PacketSuccess for the other half — together they replace building
 * a `Packet` by hand and calling ->success()/->failed() on it.
 */
class PacketFailed extends RuntimeException
{
    /** @param mixed $data extra payload alongside the message — e.g. the router's 404 attaches the unmatched path */
    public function __construct(string $message = 'Failed', private readonly int $status = 400, private readonly mixed $data = null)
    {
        parent::__construct($message);
    }

    public function status(): int
    {
        return $this->status;
    }

    public function toPacket(): Packet
    {
        return (new Packet())->failed($this->getMessage(), $this->data);
    }
}
