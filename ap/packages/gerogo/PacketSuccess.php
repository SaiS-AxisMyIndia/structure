<?php

declare(strict_types=1);

namespace Gerogo;

/**
 * The "success" half of Packet, as a named constructor instead of a
 * builder call:
 *
 *   return new PacketSuccess('User found', data: $user);
 *
 * instead of
 *
 *   return (new Packet())->success($user, 'User found');
 *
 * Message-first — $data is deliberately last and optional:
 * `new PacketSuccess('User not found')` alone is a complete, valid
 * success body (`{success:true, message:"User not found"}`, no `data`
 * key at all — see Packet::toArray()). There's no $errorCode param here
 * on purpose: `error_code` is PacketFailed's field, not this one's — see
 * Packet's docblock for why that split is enforced, not just documented.
 *
 * Still just a Packet under the hood (this only sets it up) — Kernel::
 * handle() and Response::json() need no special case for it; a plain
 * array/string/etc. returned from a controller already auto-wraps into a
 * Packet::success() anyway, so this is only for a controller that wants
 * to build one explicitly (e.g. to set a custom message, status, or data).
 *
 * See PacketFailed for the other half.
 */
class PacketSuccess extends Packet
{
    public function __construct(string $message = 'Success', int $httpStatus = 200, mixed $data = null)
    {
        $this->success($data, $message, $httpStatus);
    }
}
