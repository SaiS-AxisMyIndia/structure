<?php

declare(strict_types=1);

namespace ApiPro;

use RuntimeException;

/**
 * The "failed" half of Packet, made throwable — throw this from anywhere
 * (a controller, a middleware, InputBag's own validation, the router's
 * "not found" fallback) to fail a request with a `{success:false,...}`
 * body, without ever writing Response::json() yourself:
 *
 *   if ($user === null) {
 *       throw new PacketFailed('User not found', httpStatus: 404);
 *   }
 *
 * Two independent numbers, both optional, both default to "don't bother":
 *
 *   - `$errorCode` is an app-level code carried in the BODY as
 *     `error_code` — omitted entirely when it's "nothing" (0, same as
 *     any other empty value — see Packet::toArray()). For a client that
 *     wants to react to specific failures without string-matching
 *     `message`. There's no $data param here on purpose: `data` is
 *     PacketSuccess's field, not this one's — Packet::failed() clears it
 *     unconditionally, so a failure can never carry one. Fold anything
 *     you'd have put there into $message instead (e.g. Router's 404
 *     folds the unmatched path into the message text).
 *   - `$httpStatus` is the actual HTTP status `Response::json()` sends
 *     (default 200, same as any success) — never appears in the body
 *     itself. Set it when you actually want the wire-level status to
 *     reflect the failure, e.g. 401/404/500.
 *
 * They're unrelated on purpose: `PacketFailed('msg', 3, 404)` sends a
 * real 404 AND carries `error_code: 3` in the body; `PacketFailed('msg')`
 * alone sends 200 with just `{success:false, message:'msg'}`.
 *
 * Kernel::handle() catches PacketFailed in exactly one place and converts
 * it — same as returning a plain value auto-wraps into a success Packet,
 * throwing this auto-wraps into a failed one, using its httpStatus() for
 * the real response status. It propagates through any number of
 * middleware layers on its own (it's a real exception), so nothing in
 * between needs to catch/rethrow/care.
 *
 * See PacketSuccess for the other half — together they replace building
 * a `Packet` by hand and calling ->success()/->failed() on it.
 */
class PacketFailed extends RuntimeException
{
    // Named $errorCode, not $code — Exception already declares a $code
    // property (non-readonly, untyped), so re-declaring it readonly here
    // would fatal at class-load time ("Cannot redeclare non-readonly
    // property Exception::$code as readonly").
    private readonly int $errorCode;
    private readonly int $httpStatus;

    public function __construct(string $message = 'Failed', int $errorCode = 0, int $httpStatus = 200)
    {
        parent::__construct($message);
        $this->errorCode = $errorCode;
        $this->httpStatus = $httpStatus;
    }

    public function errorCode(): int
    {
        return $this->errorCode;
    }

    public function httpStatus(): int
    {
        return $this->httpStatus;
    }

    public function toPacket(): Packet
    {
        return (new Packet())->failed($this->getMessage(), $this->errorCode, $this->httpStatus);
    }
}
