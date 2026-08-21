<?php

declare(strict_types=1);

namespace Tester;

/**
 * `Tester::comment("...")` — write it as the first line inside a mapped
 * method's body, and it becomes that endpoint's README in the explorer.
 *
 *   #[GetMapping('/{id}')]
 *   public function show(Request $request): array
 *   {
 *       Tester::comment("Fetch one user by numeric id.\nReturns 404 if no user with that id exists.");
 *       ...
 *   }
 *
 * This call does nothing at runtime — see below for why. RouteCompiler
 * reads the string literal straight out of the method's own source text
 * (via Reflection's line numbers + PHP's tokenizer), at compile time,
 * without ever calling this method for real. That's the only way to read
 * something written inside a method body without executing that method
 * (with all its real side effects) first. The one limitation that comes
 * with reading source text instead of running code: the argument must be
 * a plain string literal written right there — no variables, no
 * concatenation, no interpolation.
 */
final class Tester
{
    public static function comment(string $text): void
    {
        // Intentionally a no-op — the text is read from source, not from
        // this call. If this method ever executes for real (a genuine
        // HTTP request reaching the endpoint), it does nothing.
    }
}
