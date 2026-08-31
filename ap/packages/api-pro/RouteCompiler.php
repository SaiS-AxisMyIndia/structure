<?php

declare(strict_types=1);

namespace ApiPro;

use ApiPro\Attributes\Middleware;
use ApiPro\Attributes\PageController;
use ApiPro\Attributes\RequestMapping;
use ApiPro\Attributes\RestController;
use InvalidArgumentException;
use ReflectionAttribute;
use ReflectionClass;
use ReflectionMethod;
use ReflectionNamedType;
use ReflectionObject;

/**
 * Turns one controller's #[RestController]/#[PageController]/
 * #[GetMapping]/#[Middleware] attributes into a plain, cacheable route
 * table — the Reflection work that used to happen inside Router on
 * every boot now happens here, once, driven by Runner (which can also
 * write the result to a file so it survives across requests — see
 * Runner::routes()). A class carries exactly one of #[RestController]/
 * #[PageController] — never both, never neither and still expect to be
 * routed — and every routed action on it must match: Page only for
 * #[PageController], never for #[RestController] (see
 * assertReturnType()).
 *
 * Every entry this returns is plain data — no objects, no closures — so
 * it round-trips through var_export()/a cache file cleanly:
 *
 *   [
 *       'method' => 'GET',
 *       'regex' => '#^/api/health$#',
 *       'controller' => HealthController::class,
 *       'action' => 'status',
 *       'path' => '/api/health',
 *       'isPage' => false, // true for a #[PageController] route — see Request::$isPage / Kernel::handle()
 *       'comment' => null, // or a Tester::comment("...") literal found in the method's source — see commentOf()
 *       'fields' => [
 *           ['source' => 'body', 'key' => 'mail', 'type' => 'Email', 'required' => true, 'kind' => 'get'],
 *       ],
 *       'middleware' => [
 *           ['class' => SessionMiddleware::class, 'overrides' => ['mandatory' => true]],
 *       ],
 *   ]
 *
 * A middleware declared as a plain class-string compiles to `overrides:
 * []` (the container autowires/defaults everything). One declared as
 * `new SomeMiddleware(mandatory: false)` inside the attribute has its
 * scalar constructor properties lifted out into `overrides` right here,
 * at compile time — Router no longer needs to reflect on anything at
 * dispatch time to "call the method directly".
 */
final class RouteCompiler
{
    /** @return list<array{method: string, regex: string, controller: class-string, action: string, path: string, isPage: bool, prefix: string, comment: string|null, fields: list<array{source: string, key: string, type: string, required: bool, kind: string}>, middleware: list<array{class: class-string, overrides: array<string, mixed>}>}> */
    public static function compile(string $controllerClass, string $modulePrefix = ''): array
    {
        $reflector = new ReflectionClass($controllerClass);
        $restAttributes = $reflector->getAttributes(RestController::class);
        $pageAttributes = $reflector->getAttributes(PageController::class);

        if ($restAttributes === [] && $pageAttributes === []) {
            return [];
        }

        if ($restAttributes !== [] && $pageAttributes !== []) {
            throw new InvalidArgumentException(
                "$controllerClass carries both #[RestController] and #[PageController] — pick one.",
            );
        }

        $isPageController = $pageAttributes !== [];
        $classAttribute = $isPageController ? $pageAttributes[0] : $restAttributes[0];
        $prefix = $modulePrefix . $classAttribute->newInstance()->prefix;
        $classMiddleware = self::middlewareOf($reflector->getAttributes(Middleware::class));

        $routes = [];

        foreach ($reflector->getMethods() as $method) {
            $mappings = $method->getAttributes(RequestMapping::class, ReflectionAttribute::IS_INSTANCEOF);

            foreach ($mappings as $mappingAttribute) {
                self::assertReturnType($controllerClass, $method, $isPageController);

                $mapping = $mappingAttribute->newInstance();
                $path = self::normalize($prefix . $mapping->path);
                $methodMiddleware = self::middlewareOf($method->getAttributes(Middleware::class));

                $routes[] = [
                    'method' => $mapping->method,
                    'regex' => self::toRegex($path),
                    'controller' => $controllerClass,
                    'action' => $method->getName(),
                    'path' => $path,
                    // Known for free, at compile time, from which
                    // attribute the class carries — the same boolean
                    // assertReturnType() just enforced against this
                    // very method. Router sets Request::$isPage from
                    // this the moment a route matches, so Kernel can
                    // tell a Page-route failure apart from a JSON one
                    // (see Kernel::handle()) without re-deriving it via
                    // Reflection at request time.
                    'isPage' => $isPageController,
                    // The controller's own declared prefix (module prefix +
                    // its #[RestController(prefix: ...)]), before the
                    // method's own mapping path is appended. Exact, real
                    // metadata — Tester groups by this instead of trying to
                    // *guess* a shared prefix from a set of paths, which
                    // is ambiguous the moment a controller has only one route.
                    'prefix' => self::normalize($prefix),
                    'comment' => self::commentOf($method),
                    'fields' => self::fieldsOf($method),
                    // Class-level middleware wraps outermost; a method-level
                    // declaration of the *same* middleware class overrides
                    // (not stacks on top of) the class-level one, so a
                    // per-action `mandatory: false` actually takes effect.
                    'middleware' => self::mergeMiddleware($classMiddleware, $methodMiddleware),
                ];
            }
        }

        return $routes;
    }

    /**
     * The one rule tying #[PageController]/#[RestController] to Page vs
     * everything else: a #[PageController] action MUST declare Page (or
     * Page as one member of a union) as its return type — Tester,
     * AppViewer, and Kernel::handle() all trust that without re-checking
     * it themselves; a #[RestController] action must NEVER declare it —
     * Page rendering belongs to #[PageController] alone, Packet (or
     * array, or nothing) to #[RestController]. Checked once here, at
     * compile time — fails loudly, at `apc build`/the first request that
     * compiles this controller — rather than as a silent runtime
     * surprise. Uses the exact same reflection Page::isReturnedBy()
     * already exposes for Tester/AppViewer's own route filtering, so
     * this and their filtering can never disagree.
     */
    private static function assertReturnType(string $controllerClass, ReflectionMethod $method, bool $isPageController): void
    {
        $returnsPage = Page::isReturnedBy($controllerClass, $method->getName());

        if ($isPageController && !$returnsPage) {
            throw new InvalidArgumentException(sprintf(
                '%s::%s() is #[PageController] but its return type is not Page — a PageController action must return Page.',
                $controllerClass,
                $method->getName(),
            ));
        }

        if (!$isPageController && $returnsPage) {
            throw new InvalidArgumentException(sprintf(
                '%s::%s() is #[RestController] but declares Page as its return type — Page is only allowed on a #[PageController]; return Packet instead.',
                $controllerClass,
                $method->getName(),
            ));
        }
    }

    /**
     * Finds `Tester::comment("...")` written inside the method's own
     * body and returns its string literal argument — read from the
     * method's SOURCE TEXT (via its start/end line numbers + PHP's own
     * tokenizer), never by calling the method. That's the only way to
     * read something written inside a method body without executing it
     * — with real side effects — first. Returns null if no such call
     * appears, and only recognizes a plain string literal argument (no
     * variables/concatenation/interpolation — see Tester::comment()'s
     * own docblock for why).
     */
    private static function commentOf(ReflectionMethod $method): ?string
    {
        $source = self::methodSource($method);

        return $source === null ? null : self::extractCommentCall($source);
    }

    /**
     * Every `$request->body->getX(...)`/`->query->getX(...)`/
     * `->params->getX(...)` call found in the method's own source — the
     * same InputBag getters documented in "Validating input with
     * InputBag" — reduced to what the Tester/AppViewer UIs need to
     * render a real field instead of a freeform textbox. `params` calls
     * (e.g. `$request->params->getInt('id')`) feed the *same* path-param
     * input Tester already shows for every `{id}` in the route — this
     * just gives that input its real type/required badge instead of a
     * blind "always required, no type" guess, when the controller
     * actually validates it.
     *
     * An `addX(...)` call (InputBag's write counterpart — see its own
     * docblock) is picked up the same way but tagged `kind: 'add'`
     * instead of `'get'`, `required: false` always (there's nothing to
     * require — the controller provides it, not the caller): AppViewer
     * shows these as a plain read-only mention (e.g. "posts, provided by
     * the controller"), never an editable input, since nothing a caller
     * types would ever reach it.
     *
     * required (for a 'get' field) mirrors InputBag's own rule exactly:
     * for getMail/getPassword, required unless the second argument is
     * literally `false`; for every other getter, required unless a
     * second argument is given (anything other than a bare `null`). Only
     * a call whose key is a plain string literal is recognized — same
     * limitation as Tester::comment(): this reads source text, it
     * doesn't evaluate it.
     *
     * @return list<array{source: string, key: string, type: string, required: bool, kind: string}>
     */
    private static function fieldsOf(ReflectionMethod $method): array
    {
        $source = self::methodSource($method);
        $requestParam = self::requestParameterName($method);

        if ($source === null || $requestParam === null) {
            return [];
        }

        return self::extractFieldCalls($source, $requestParam);
    }

    private static function methodSource(ReflectionMethod $method): ?string
    {
        $file = $method->getDeclaringClass()->getFileName();

        if ($file === false) {
            return null;
        }

        $lines = file($file);

        if ($lines === false) {
            return null;
        }

        return implode('', array_slice($lines, $method->getStartLine() - 1, $method->getEndLine() - $method->getStartLine() + 1));
    }

    /** The variable name of the method's Request-typed parameter (e.g. "request" for `Request $request`), or null if it has none. */
    private static function requestParameterName(ReflectionMethod $method): ?string
    {
        foreach ($method->getParameters() as $parameter) {
            $type = $parameter->getType();

            if ($type instanceof ReflectionNamedType && $type->getName() === Request::class) {
                return $parameter->getName();
            }
        }

        return null;
    }

    /** @return list<mixed> filtered, meaningful tokens (no whitespace/comments) */
    private static function meaningfulTokens(string $source): array
    {
        return array_values(array_filter(
            token_get_all("<?php\n" . $source),
            static fn (mixed $token): bool => !(is_array($token) && in_array($token[0], [T_WHITESPACE, T_COMMENT, T_DOC_COMMENT], true)),
        ));
    }

    private static function extractCommentCall(string $source): ?string
    {
        $tokens = self::meaningfulTokens($source);

        foreach ($tokens as $i => $token) {
            if (!is_array($token) || $token[0] !== T_STRING || $token[1] !== 'Tester') {
                continue;
            }

            if (
                is_array($tokens[$i + 1] ?? null) && $tokens[$i + 1][0] === T_DOUBLE_COLON
                && is_array($tokens[$i + 2] ?? null) && $tokens[$i + 2][0] === T_STRING && $tokens[$i + 2][1] === 'comment'
                && ($tokens[$i + 3] ?? null) === '('
                && is_array($tokens[$i + 4] ?? null) && $tokens[$i + 4][0] === T_CONSTANT_ENCAPSED_STRING
            ) {
                $text = self::unescapeLiteral($tokens[$i + 4][1]);

                return $text === '' ? null : $text;
            }
        }

        return null;
    }

    private const BAG_SOURCES = ['body', 'query', 'params'];

    /** @return list<array{source: string, key: string, type: string, required: bool, kind: string}> */
    private static function extractFieldCalls(string $source, string $requestParam): array
    {
        $tokens = self::meaningfulTokens($source);
        $needle = '$' . $requestParam;
        $fields = [];

        foreach ($tokens as $i => $token) {
            if (!is_array($token) || $token[0] !== T_VARIABLE || $token[1] !== $needle) {
                continue;
            }

            // $request -> body|query -> getXxx( ... )
            if (!(is_array($tokens[$i + 1] ?? null) && $tokens[$i + 1][0] === T_OBJECT_OPERATOR)) {
                continue;
            }

            $bagToken = $tokens[$i + 2] ?? null;

            if (!(is_array($bagToken) && $bagToken[0] === T_STRING && in_array($bagToken[1], self::BAG_SOURCES, true))) {
                continue;
            }

            if (!(is_array($tokens[$i + 3] ?? null) && $tokens[$i + 3][0] === T_OBJECT_OPERATOR)) {
                continue;
            }

            $methodToken = $tokens[$i + 4] ?? null;
            $method = is_array($methodToken) && $methodToken[0] === T_STRING ? $methodToken[1] : null;
            $isAdd = $method !== null && str_starts_with($method, 'add');
            $isGet = $method !== null && str_starts_with($method, 'get');

            if (!$isAdd && !$isGet) {
                continue;
            }

            if (($tokens[$i + 5] ?? null) !== '(') {
                continue;
            }

            $call = self::readCallArguments($tokens, $i + 6);

            if ($call === null || $call['args'] === []) {
                continue;
            }

            $keyToken = $call['args'][0][0] ?? null;

            if (!(is_array($keyToken) && $keyToken[0] === T_CONSTANT_ENCAPSED_STRING)) {
                continue; // a dynamic/non-literal key — nothing statically knowable to show
            }

            $fields[] = [
                'source' => $bagToken[1],
                'key' => self::unescapeLiteral($keyToken[1]),
                'type' => self::fieldType($method),
                'required' => $isAdd ? false : self::isFieldRequired($method, $call['args'][1] ?? null),
                'kind' => $isAdd ? 'add' : 'get',
            ];
        }

        return $fields;
    }

    /**
     * Reads a call's argument list starting right after its opening `(`
     * (already consumed by the caller), splitting on top-level commas —
     * depth tracks both `(...)` and `[...]` so a nested array literal
     * (e.g. a default value of `[]`) doesn't get mistaken for the end of
     * the call or an extra argument.
     *
     * @param list<mixed> $tokens
     * @return array{args: list<list<mixed>>}|null
     */
    private static function readCallArguments(array $tokens, int $start): ?array
    {
        $depth = 1;
        $args = [];
        $current = [];

        for ($i = $start, $count = count($tokens); $i < $count; $i++) {
            $token = $tokens[$i];
            $text = is_array($token) ? $token[1] : $token;

            if ($text === '(' || $text === '[') {
                $depth++;
            } elseif ($text === ')' || $text === ']') {
                $depth--;

                if ($depth === 0) {
                    if ($current !== []) {
                        $args[] = $current;
                    }

                    return ['args' => $args];
                }
            } elseif ($text === ',' && $depth === 1) {
                $args[] = $current;
                $current = [];

                continue;
            }

            $current[] = $token;
        }

        return null; // unbalanced — a truncated/malformed source slice
    }

    /** Normalizes by the part after the 'get'/'add' prefix (both 3 chars) — one map for InputBag's whole getX()/addX() pair, not two. */
    private static function fieldType(string $method): string
    {
        return match (substr($method, 3)) {
            'String' => 'String',
            'Int' => 'Integer',
            'Float' => 'Float',
            'Bool' => 'Boolean',
            'Array' => 'Array',
            'Json' => 'JSON',
            'Mail' => 'Email',
            'Password' => 'Password',
            default => substr($method, 3),
        };
    }

    /** @param list<mixed>|null $secondArg */
    private static function isFieldRequired(string $getter, ?array $secondArg): bool
    {
        if ($secondArg === null) {
            return true; // no default/required argument given -> mandatory either way
        }

        $literal = self::singleTokenLiteral($secondArg);

        if (in_array($getter, ['getMail', 'getPassword'], true)) {
            return $literal !== 'false'; // required: bool $required = true -> only an explicit false makes it optional
        }

        return $literal === 'null'; // ?T $default = null -> only an explicit (or omitted) null keeps it mandatory
    }

    /** @param list<mixed> $tokens */
    private static function singleTokenLiteral(array $tokens): ?string
    {
        if (count($tokens) !== 1) {
            return null; // a complex expression (e.g. [] or a variable) — not a bare true/false/null literal
        }

        $token = $tokens[0];
        $text = is_array($token) ? $token[1] : $token;

        return is_string($text) ? strtolower($text) : null;
    }

    /** Un-escapes a raw T_CONSTANT_ENCAPSED_STRING token's text (quotes included) into its actual value. */
    private static function unescapeLiteral(string $raw): string
    {
        $quote = $raw[0];
        $inner = substr($raw, 1, -1);

        if ($quote === "'") {
            return strtr($inner, ['\\\\' => '\\', "\\'" => "'"]);
        }

        // Double-quoted: only the common escape sequences — Tester::comment()
        // is meant for a plain literal, not interpolation, so anything else
        // (e.g. \u{...}, octal/hex escapes, $variables) is left as-is.
        return strtr($inner, [
            '\\\\' => '\\',
            '\\"' => '"',
            '\\n' => "\n",
            '\\r' => "\r",
            '\\t' => "\t",
            '\\v' => "\v",
            '\\f' => "\f",
            '\\e' => "\e",
            '\\$' => '$',
        ]);
    }

    /** @param list<ReflectionAttribute<Middleware>> $attributes */
    private static function middlewareOf(array $attributes): array
    {
        $middleware = [];

        foreach ($attributes as $attribute) {
            foreach ($attribute->newInstance()->middleware as $entry) {
                $middleware[] = self::normalizeMiddleware($entry);
            }
        }

        return $middleware;
    }

    /**
     * A plain class-string compiles with no overrides — the container
     * autowires it fresh at dispatch time. An already-built instance came
     * from `new SomeMiddleware(...)` inside the attribute — PHP
     * constructed it directly with no container involved, so it only ever
     * carries scalar config (e.g. `mandatory: false`), never its real
     * service dependencies. That config is lifted out via reflection right
     * here, once, instead of on every dispatch.
     *
     * @return array{class: class-string, overrides: array<string, mixed>}
     */
    private static function normalizeMiddleware(string|MiddlewareInterface $entry): array
    {
        if (is_string($entry)) {
            return ['class' => $entry, 'overrides' => []];
        }

        $overrides = [];

        foreach ((new ReflectionObject($entry))->getProperties() as $property) {
            $type = $property->getType();

            // Only lift plain config (bool/string/int/float/array/...) back
            // out — object-typed properties (services) are left for the
            // container to autowire fresh, since the attribute-built
            // instance never had a real one to begin with.
            if ($type instanceof ReflectionNamedType && $type->isBuiltin() && $property->isInitialized($entry)) {
                $overrides[$property->getName()] = $property->getValue($entry);
            }
        }

        return ['class' => $entry::class, 'overrides' => $overrides];
    }

    /**
     * Merges class-level and method-level middleware lists so that a
     * method-level entry replaces any class-level entry of the same
     * middleware class, in place, rather than both running. Entries whose
     * class doesn't appear at the class level are appended as-is.
     *
     * @param list<array{class: class-string, overrides: array<string, mixed>}> $classMiddleware
     * @param list<array{class: class-string, overrides: array<string, mixed>}> $methodMiddleware
     * @return list<array{class: class-string, overrides: array<string, mixed>}>
     */
    private static function mergeMiddleware(array $classMiddleware, array $methodMiddleware): array
    {
        $merged = [];

        foreach ($classMiddleware as $entry) {
            $merged[$entry['class']] = $entry;
        }

        foreach ($methodMiddleware as $entry) {
            $merged[$entry['class']] = $entry;
        }

        return array_values($merged);
    }

    private static function normalize(string $path): string
    {
        $path = '/' . trim($path, '/');

        return $path === '/' ? $path : rtrim($path, '/');
    }

    private static function toRegex(string $path): string
    {
        // `[^/]*` — zero or more, not one or more — so a genuinely empty
        // segment (e.g. requesting ".../{id}" with nothing after the
        // final slash) still MATCHES this route (with params['id'] === '')
        // instead of falling through to the router's generic 404. That
        // hands the empty value to the controller's own InputBag call,
        // which reports the real, specific validation error ("'id' is
        // required." / "must be an integer.") — see Request::$path for
        // the other half of why this matters.
        $pattern = preg_replace('#\{(\w+)\}#', '(?P<$1>[^/]*)', $path);

        return '#^' . $pattern . '$#';
    }
}
