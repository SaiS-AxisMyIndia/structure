<?php

declare(strict_types=1);

namespace Gerogo;

use ArrayAccess;
use ArrayIterator;
use Countable;
use IteratorAggregate;
use Traversable;

/**
 * A validated view over one input source — `$request->query`,
 * `$request->body`, and `$request->params` are all one of these. Plain
 * array access (`$bag['key']`) still works; the getX() methods add type
 * validation and mandatory/optional handling on top.
 *
 * Every getX() follows the same rule: omit the second argument (or pass
 * `null` explicitly) and the key is MANDATORY — missing, or present with
 * the wrong type, fails the whole request with a 400 `Packet` before your
 * controller code ever runs. Pass any other value as the default —
 * including '', 0, false, or [] — and the key becomes OPTIONAL; that value
 * is what you get back when the key is absent, OR when it's present but
 * blank (an empty string) and can't be coerced into the target type — a
 * path param like `{id}` captures exactly that when its URL segment is
 * empty, so an optional getInt('id', 0) degrades to 0 instead of 400ing
 * on a value that was never really "an integer" or "not an integer",
 * just missing. A present, NON-blank value that still doesn't coerce
 * (e.g. "abc" for getInt()) always 400s, optional or not.
 *
 *   $request->body->getMail('mail');                 // required — 400 if missing/invalid
 *   $request->params->getString('lang', 'en');        // optional — 'en' if absent
 *   $request->body->getInt('age', 0);                 // optional — 0 if absent OR blank
 *
 * addX() is the write counterpart — one per getX() (addString/addInt/
 * addFloat/addBool/addArray/addJson/addMail/addPassword), fluent (each
 * returns $this). For a controller putting something INTO the request
 * for a #[PageController] view to read back out via the exact same
 * getX() call, rather than a separate props/container-passing mechanism:
 *
 *   $request->body->addJson('posts', $this->postService->all());
 *   return new Page($request, 'HomePage'); // HomePage.php: $request->body->getJson('posts', [])
 */
final class InputBag implements ArrayAccess, Countable, IteratorAggregate
{
    /** @param array<int|string, mixed> $items */
    public function __construct(private array $items)
    {
    }

    public function has(string $key): bool
    {
        return array_key_exists($key, $this->items) && $this->items[$key] !== null;
    }

    /** @return array<int|string, mixed> */
    public function all(): array
    {
        return $this->items;
    }

    public function getString(string $key, ?string $default = null): string
    {
        return $this->resolve($key, $default, static fn (mixed $v): ?string => is_scalar($v) ? (string) $v : null, 'a string');
    }

    public function getInt(string $key, ?int $default = null): int
    {
        return $this->resolve($key, $default, static function (mixed $v): ?int {
            if (is_int($v)) {
                return $v;
            }

            if (is_float($v) && $v === floor($v)) {
                return (int) $v;
            }

            return (is_string($v) && preg_match('/^-?\d+$/', $v) === 1) ? (int) $v : null;
        }, 'an integer');
    }

    public function getFloat(string $key, ?float $default = null): float
    {
        return $this->resolve($key, $default, static function (mixed $v): ?float {
            if (is_int($v) || is_float($v)) {
                return (float) $v;
            }

            return (is_string($v) && is_numeric($v)) ? (float) $v : null;
        }, 'a number');
    }

    public function getBool(string $key, ?bool $default = null): bool
    {
        return $this->resolve($key, $default, static function (mixed $v): ?bool {
            if (is_bool($v)) {
                return $v;
            }

            if (is_int($v) && ($v === 0 || $v === 1)) {
                return $v === 1;
            }

            if (is_string($v)) {
                $lower = strtolower($v);

                if (in_array($lower, ['true', '1'], true)) {
                    return true;
                }

                if (in_array($lower, ['false', '0'], true)) {
                    return false;
                }
            }

            return null;
        }, 'a boolean');
    }

    /**
     * @param array<mixed>|null $default
     * @return array<mixed>
     */
    public function getArray(string $key, ?array $default = null): array
    {
        return $this->resolve($key, $default, static fn (mixed $v): ?array => is_array($v) ? $v : null, 'an array');
    }

    /**
     * getJson() — the value must already be an array (a nested body field
     * is decoded that way automatically) or a string containing valid
     * JSON that itself decodes to an array/object.
     *
     * @param array<mixed>|null $default
     * @return array<mixed>
     */
    public function getJson(string $key, ?array $default = null): array
    {
        return $this->resolve($key, $default, static function (mixed $v): ?array {
            if (is_array($v)) {
                return $v;
            }

            if (!is_string($v)) {
                return null;
            }

            $decoded = json_decode($v, true);

            return is_array($decoded) ? $decoded : null;
        }, 'valid JSON');
    }

    /** getMail($key, required: true|false) — note: required flag, not a default value. */
    public function getMail(string $key, bool $required = true): string
    {
        return $this->resolveRequired($key, $required, static function (mixed $v): ?string {
            return is_string($v) && filter_var($v, FILTER_VALIDATE_EMAIL) !== false ? $v : null;
        }, 'a valid email address');
    }

    /** getPassword($key, required: true|false) — note: required flag, not a default value. */
    public function getPassword(string $key, bool $required = true): string
    {
        return $this->resolveRequired($key, $required, static function (mixed $v): ?string {
            return is_string($v) && $v !== '' ? $v : null;
        }, 'a non-empty password');
    }

    public function addString(string $key, string $value): static
    {
        return $this->add($key, $value);
    }

    public function addInt(string $key, int $value): static
    {
        return $this->add($key, $value);
    }

    public function addFloat(string $key, float $value): static
    {
        return $this->add($key, $value);
    }

    public function addBool(string $key, bool $value): static
    {
        return $this->add($key, $value);
    }

    /** @param array<mixed> $value */
    public function addArray(string $key, array $value): static
    {
        return $this->add($key, $value);
    }

    /** @param array<mixed> $value */
    public function addJson(string $key, array $value): static
    {
        return $this->add($key, $value);
    }

    public function addMail(string $key, string $value): static
    {
        return $this->add($key, $value);
    }

    public function addPassword(string $key, string $value): static
    {
        return $this->add($key, $value);
    }

    private function add(string $key, mixed $value): static
    {
        $this->items[$key] = $value;

        return $this;
    }

    /** @param callable(mixed): mixed $coerce */
    private function resolve(string $key, mixed $default, callable $coerce, string $expected): mixed
    {
        $mandatory = $default === null;

        if (!$this->has($key)) {
            if ($mandatory) {
                $this->fail("'$key' is required.");
            }

            return $default;
        }

        $raw = $this->items[$key];
        $coerced = $coerce($raw);

        if ($coerced === null) {
            // A blank string can't coerce into an int/float/bool/array/JSON
            // value — but it isn't really "a value" for those types either
            // (this is exactly what a route placeholder like {id} captures
            // when the URL segment itself is empty). Optional (a default
            // was given) treats that the same as absent, instead of
            // failing a type check that was never really the point;
            // mandatory (no default at all) still 400s — there's nothing
            // to fall back to.
            if (!$mandatory && $raw === '') {
                return $default;
            }

            $this->fail("'$key' must be $expected.");
        }

        return $coerced;
    }

    /** @param callable(mixed): (string|null) $coerce */
    private function resolveRequired(string $key, bool $required, callable $coerce, string $expected): string
    {
        if (!$this->has($key)) {
            if ($required) {
                $this->fail("'$key' is required.");
            }

            return '';
        }

        $raw = $this->items[$key];
        $coerced = $coerce($raw);

        if ($coerced === null) {
            // Same "blank means absent, once it's already optional"
            // treatment as resolve() above.
            if (!$required && $raw === '') {
                return '';
            }

            $this->fail("'$key' must be $expected.");
        }

        return $coerced;
    }

    private function fail(string $message): never
    {
        throw new PacketFailed($message, 0, 400);
    }

    public function offsetExists(mixed $offset): bool
    {
        return isset($this->items[$offset]);
    }

    public function offsetGet(mixed $offset): mixed
    {
        return $this->items[$offset] ?? null;
    }

    public function offsetSet(mixed $offset, mixed $value): void
    {
        if ($offset === null) {
            $this->items[] = $value;
        } else {
            $this->items[$offset] = $value;
        }
    }

    public function offsetUnset(mixed $offset): void
    {
        unset($this->items[$offset]);
    }

    public function count(): int
    {
        return count($this->items);
    }

    public function getIterator(): Traversable
    {
        return new ArrayIterator($this->items);
    }
}
