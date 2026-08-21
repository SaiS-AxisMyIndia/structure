<?php

declare(strict_types=1);

namespace ApiPro;

/**
 * The "success" half of Packet, as a named constructor instead of a
 * builder call:
 *
 *   return new PacketSuccess($user, 'User found');
 *
 * instead of
 *
 *   return (new Packet())->success($user, 'User found');
 *
 * Still just a Packet under the hood (this only sets it up) — Kernel::
 * handle() and Response::json() need no special case for it; a plain
 * array/string/etc. returned from a controller already auto-wraps into a
 * Packet::success() anyway, so this is only for a controller that wants
 * to build one explicitly (e.g. to set a custom message).
 *
 * See PacketFailed for the other half.
 */
class PacketSuccess extends Packet
{
    public function __construct(mixed $data = null, string $message = 'Success')
    {
        $this->success($data, $message);
    }
}
