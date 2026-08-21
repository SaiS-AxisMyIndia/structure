<?php

declare(strict_types=1);

namespace ApiPro;

/**
 * A uniform API response envelope — { success, message, data, ...meta } —
 * the same idea as wrapping a Spring controller's return in a shared
 * ApiResponse<T> DTO instead of returning raw bodies from every endpoint.
 * This is the only shape `Response::json()` accepts — every response,
 * success or failure, goes out through one Packet.
 *
 *   $packet = new Packet();
 *
 *   return $user !== null
 *       ? $packet->success($user, 'User found')
 *       : $packet->failed('User not found');
 */
class Packet
{
    private bool $isSuccess = true;
    private string $message = '';
    private mixed $data = null;

    /** @var array<string, mixed> Extra top-level fields — e.g. Session attaches 'token' here. */
    private array $meta = [];

    public function success(mixed $data = null, string $message = 'Success'): static
    {
        $this->isSuccess = true;
        $this->message = $message;
        $this->data = $data;

        return $this;
    }

    public function failed(string $message = 'Failed', mixed $data = null): static
    {
        $this->isSuccess = false;
        $this->message = $message;
        $this->data = $data;

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

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return [
            'success' => $this->isSuccess,
            'message' => $this->message,
            'data' => $this->data,
            ...$this->meta,
        ];
    }
}
