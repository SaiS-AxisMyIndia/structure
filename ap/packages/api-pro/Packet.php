<?php

declare(strict_types=1);

namespace ApiPro;

/**
 * A uniform API response envelope — { success, message, ...data/errorCode,
 * ...meta } — the same idea as wrapping a Spring controller's return in a
 * shared ApiResponse<T> DTO instead of returning raw bodies from every
 * endpoint. This is the only shape `Response::json()` accepts — every
 * response, success or failure, goes out through one Packet.
 *
 *   $packet = new Packet();
 *
 *   return $user !== null
 *       ? $packet->success($user, 'User found')
 *       : $packet->failed('User not found');
 *
 * `data` and `errorCode` belong to exactly one side each — `data` is a
 * success concept, `errorCode` a failure one — and that's enforced HERE,
 * not just by convention on PacketSuccess/PacketFailed: success() always
 * clears errorCode to 0, failed() always clears data to null. So no
 * matter how a Packet gets built, at most one of `data`/`error_code` is
 * ever in the body — never both, never the "wrong" one for the result.
 *
 * `Response` and `Packet` are different concerns: `Response::json()` is
 * the connection layer (it writes the actual HTTP status line), `Packet`
 * is the data layer (`success`/`message`/`data`/`errorCode` describe the
 * result). They're related but independent — `httpStatus` defaults to
 * 200 regardless of `success`/`errorCode`, but can be set explicitly (see
 * `success()`/`failed()`) when a real HTTP status is actually wanted;
 * `Kernel::handle()` reads it off whatever `Packet` it's about to send
 * and passes it straight to `Response::json()`.
 */
class Packet
{
    private bool $isSuccess = true;
    private string $message = '';
    private mixed $data = null;
    private int $errorCode = 0;
    private int $httpStatus = 200;

    /** @var array<string, mixed> Extra top-level fields — e.g. Session attaches 'token' here. */
    private array $meta = [];

    public function success(mixed $data = null, string $message = 'Success', int $httpStatus = 200): static
    {
        $this->isSuccess = true;
        $this->message = $message;
        $this->data = $data;
        $this->errorCode = 0; // data is the success side's field — never errorCode
        $this->httpStatus = $httpStatus;

        return $this;
    }

    /**
     * $errorCode is an app-level code, not an HTTP status — it travels in
     * the body as `error_code` (omitted when it's "nothing", same rule as
     * `data` below). $httpStatus IS the real status `Response::json()`
     * sends (default 200, same as success) — set it explicitly when you
     * want the wire-level status to actually reflect the failure (401,
     * 404, ...); it never itself appears in the body.
     */
    public function failed(string $message = 'Failed', int $errorCode = 0, int $httpStatus = 200): static
    {
        $this->isSuccess = false;
        $this->message = $message;
        $this->data = null; // errorCode is the failure side's field — never data
        $this->errorCode = $errorCode;
        $this->httpStatus = $httpStatus;

        return $this;
    }

    /** Attaches an extra top-level field alongside success/message/data (e.g. a session token). */
    public function with(string $key, mixed $value): static
    {
        $this->meta[$key] = $value;

        return $this;
    }

    public function message(): string
    {
        return $this->message;
    }

    public function data(): mixed
    {
        return $this->data;
    }

    public function isSuccess(): bool
    {
        return $this->isSuccess;
    }

    /** The real HTTP status `Response::json()` should send for this Packet — see the class docblock. */
    public function httpStatus(): int
    {
        return $this->httpStatus;
    }

    /**
     * @return array<string, mixed>
     *
     * `error_code`/`data` are each dropped from the body when "empty" in
     * the loose PHP sense — `null`, `0`, `''`, `[]`, `false` all count —
     * not just strictly `null`/`0`. A plain `failed('message')` (or any
     * `success()`/`PacketSuccess` built from just a message) stays a bare
     * `{success, message}`, so a client never has to account for a field
     * nobody bothered to set. `httpStatus` never appears here at all —
     * it's consumed by `Response::json()`, not part of the body.
     */
    public function toArray(): array
    {
        return [
            'success' => $this->isSuccess,
            'message' => $this->message,
            ...(!empty($this->errorCode) ? ['error_code' => $this->errorCode] : []),
            ...(!empty($this->data) ? ['data' => $this->data] : []),
            ...$this->meta,
        ];
    }
}
