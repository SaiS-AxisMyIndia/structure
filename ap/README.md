# api-project

A PHP project built on a small, hand-rolled Spring-Boot-style micro-framework:
attribute-based routing (`#[RestController]`, `#[GetMapping]`, ...), a
constructor-autowiring DI container, a `#[Middleware]`-declared interceptor
pipeline, and a `Kernel` that plays the role of `SpringApplication` — plus a
MySQL layer (`ProSql`), a stateless, JWT-style session layer (`Session`), and
a Swagger-like interactive API explorer (`Tester`) served at `/tester`.

`packages/api-pro`, `packages/pro-sql`, `packages/session` and
`packages/tester` are **framework packages** (treat them like
dependencies/libraries — namespaces `ApiPro\`, `ProSql\`, `Session\`,
`Tester\`). Your **application** lives at the project root in `src/`
(namespace `App\`) and depends on them, the way a Spring Boot app depends
on `spring-boot-starter-web` / `-jdbc` / `-security` without embedding any
of them in its own source.

## Structure

```
.
├── composer.json           # root manifest — requires all 4 packages (path repos), autoloads App\ -> src/
├── apc                        # the CLI (php apc ...) — apc -v, apc start, apc build [-c], apc install, apc module <name>
├── app.php                    # the application manifest (like application.properties) — name/version/env + modules to boot
├── lib/                         # never web-reachable (see .htaccess)
│   ├── page.html                  # the base <!doctype html> layout Page::render() fills in (builder mode)
│   └── page/
│       └── HomePage.php             # a complete page written in PHP (view mode) — see Page::view()
├── runner/                     # never web-reachable (see .htaccess) — boot-time config, one file per concern
│   ├── runner.php                 # boots ApiPro\Runner — loads .env + app.php + every sibling file here, once
│   ├── prosql.php                  # DB_* config, consumed by ProSqlModule via Runner::get('prosql')
│   ├── session.php                 # SESSION_* config, consumed by SessionModule via Runner::get('session')
│   ├── controllers.php             # this app's own controller list, consumed by Application via Runner::get('controllers')
│   └── tester.php                  # { enabled }, consumed by TesterModule via Runner::get('tester') — TESTER_ENABLED in .env
├── index.php                 # front controller: requires runner/runner.php, boots the Kernel, handles the request
├── .htaccess                  # rewrites every request to index.php; forbids direct access to runner/
├── .env.dev                    # copy to .env — APP_ENV, DB_*, SESSION_*
├── storage/
│   ├── logs/                   # runtime output
│   └── routes.cache.php        # written by Runner::routes() outside env: local — gitignored, delete to force a rebuild
├── src/                       # YOUR application ("App\")
│   ├── Application.php           # @SpringBootApplication equivalent — registers services + controllers
│   ├── Controllers/
│   │   ├── HealthController.php      # GET /api/health (mandatory), GET /api/health/ping (not, issues a token), POST /api/health/logout
│   │   ├── UserController.php        # GET /api/users, GET /api/users/{id}
│   │   └── HomeController.php        # GET /api-pro (a Page::view() sample), POST /api-pro/posts
│   └── Services/
│       ├── UserService.php
│       └── PostService.php           # in-memory demo data behind HomeController — same limitation as UserService
└── packages/
    ├── api-pro/               # the WEB framework package ("ApiPro\") — a dependency, not app code
    │   ├── composer.json
    │   ├── Kernel.php             # SpringApplication.run() equivalent
    │   ├── Container.php          # DI container (constructor autowiring + makeWith() overrides)
    │   ├── Router.php             # DispatcherServlet + interceptor-chain equivalent
    │   ├── Module.php             # contract every app "module" implements (register/controllers/prefix)
    │   ├── MiddlewareInterface.php # contract every middleware implements
    │   ├── PackageResolver.php    # resolves an app.php '@name' => 'version' entry to a packages/ Module
    │   ├── Runner.php             # loads .env + app.php once; resolves modules once; compiles + caches routes once
    │   ├── RouteCompiler.php      # attributes -> a plain, cacheable route table, plus Tester::comment()/InputBag calls read from source text
    │   ├── Cli/                   # the apc CLI's command classes (Application, VersionCommand, BuildCommand, InstallCommand, ModuleCommand)
    │   ├── Packet.php             # uniform {success, message, data} response envelope
    │   ├── Page.php               # a complete HTML page — builder mode (lib/page.html) or view mode (lib/page/*.php) — Packet's counterpart for web pages
    │   ├── InputBag.php           # validated getString/getInt/getJson/getMail/... — backs query/body/params
    │   ├── Request.php / Response.php
    │   └── Attributes/            # @RestController / @GetMapping / .../ @Middleware / @Service
    │
    ├── pro-sql/                # the MYSQL package ("ProSql\") — a dependency, not app code
    │   ├── composer.json
    │   ├── Connection.php          # lazy PDO wrapper: statement()/select()/lastInsertId()/transaction()
    │   ├── QueryBuilder.php        # fluent, parameter-bound builder: where/orWhere/whereIn/join/orderBy/limit/get/first/count/insert/update/delete
    │   ├── Repository.php          # base CRUD repo (JpaRepository equivalent): all/find/create/updateById/deleteById
    │   ├── ProSqlModule.php        # wires a shared Connection into the container, config read via Runner::get('prosql')
    │   └── Exceptions/QueryException.php
    │
    ├── session/                # the SESSION package ("Session\") — a dependency, not app code
    │   ├── composer.json
    │   ├── SessionConfig.php        # typed secret/ttl/refresh_ttl/version/enc, built by SessionModule from Runner::get('session')
    │   ├── SessionToken.php         # the decoded shape: id/created_at/expire_at/version/encKey + data
    │   ├── SessionCodec.php         # signs (HMAC) + optionally encrypts (AES-256) a SessionToken to/from a compact string
    │   ├── Session.php              # create()/resolve()/response()/logout() — the manager, holds "the current token"
    │   ├── SessionMiddleware.php    # resolves the incoming token, then wraps the result via Session::response()
    │   └── SessionModule.php        # builds SessionConfig/SessionCodec/Session, config read via Runner::get('session')
    │
    └── tester/                 # the TESTER package ("Tester\") — a dependency, not app code
        ├── composer.json
        ├── TesterModule.php         # contributes TesterController only when Runner::get('tester')['enabled']
        ├── TesterController.php     # GET /tester (the UI page), GET /tester/routes (JSON route list)
        ├── Tester.php               # Tester::comment("...") — a runtime no-op; RouteCompiler reads its argument from source text instead
        └── resources/index.html     # the UI itself — vanilla HTML/CSS/JS, no build step, no CDN
```

Each package's version and dependencies live in its own `composer.json`. The
root [composer.json](composer.json) declares your app's dependency on all
three (as local path repositories) and autoloads your own `src/` under
`App\`. [app.php](app.php) — at the project root, not nested in a `config/`
folder — lists which modules the `Kernel` should boot, and
[runner/runner.php](runner/runner.php) is what actually loads it (see below).

## runner/ and ApiPro\Runner

`runner/` is boot-time config, one file per concern, never web-reachable
(`.htaccess` forbids it — only `require()`d by PHP):

- **[runner/runner.php](runner/runner.php)** — "the configuration set for
  running". Loads Composer's autoloader, calls `ApiPro\Runner::boot($basePath)`
  (which reads `.env`, evaluates `app.php`, and requires every other file
  in this folder — all exactly once), and returns the fully resolved
  config array. [index.php](index.php) just does:

  ```php
  $config = require __DIR__ . '/runner/runner.php';

  Kernel::boot($config)->handle();
  ```

- **[runner/prosql.php](runner/prosql.php)** — DB_* config, read via
  `Runner::get('prosql')` inside `ProSqlModule`.
- **[runner/session.php](runner/session.php)** — SESSION_* config, read
  via `Runner::get('session')` inside `SessionModule`.
- **[runner/controllers.php](runner/controllers.php)** — this app's own
  controller classes, read via `Runner::get('controllers')` inside
  `App\Application::controllers()`, instead of hardcoding the list there.
- **[runner/tester.php](runner/tester.php)** — `{ enabled }` for
  `packages/tester`'s API explorer, read via `Runner::get('tester')`
  inside `TesterModule` (`TESTER_ENABLED` in `.env`) — see "Using Tester"
  below.

The point isn't only "fewer lines in `index.php`" — it's that **nothing
else should read `$_ENV`, `require app.php`, or `require` a `runner/*.php`
file on its own**. `Runner` holds the result in a static, so calling
`boot()` again this request is a no-op, and anything downstream — a
`Module::register()`, a service, a controller — asks `Runner` instead of
duplicating that work:

```php
use ApiPro\Runner;

Runner::get('name');              // a key from app.php's returned array — e.g. 'api-pro'
Runner::get('prosql');            // runner/prosql.php's array, whole
Runner::env('DB_HOST', '127.0.0.1'); // a raw environment variable, loaded from .env by boot()
```

`ProSqlModule`/`SessionModule`/`Application` are the working examples —
each reads its own `Runner::get('...')` key rather than touching `$_ENV`
or hardcoding a list directly. Do the same for any new module or app
config: add a `runner/<name>.php` file, list it in `Runner::boot()`'s
loop, and read it back with `Runner::get('<name>')`.

### Endpoints are compiled once, not re-scanned per dispatch

`Runner` also resolves every module (`Runner::modules()`) and compiles
every one of their controllers' `#[RestController]`/`#[GetMapping]`/
`#[Middleware]` attributes into a plain route table (`Runner::routes()`,
via `ApiPro\RouteCompiler`) — Reflection only ever runs here, never inside
`Router::dispatch()`. `Kernel` just hands that table to `Router`, which
matches a request's path/method against it and calls the controller
method directly.

Even middleware config is resolved at this compile step, not at dispatch:
`#[Middleware(new SessionMiddleware(mandatory: false))]` has `mandatory`
lifted out of that attribute-built instance right there in
`RouteCompiler`, stored as plain data (`['class' => SessionMiddleware::class,
'overrides' => ['mandatory' => false]]`). `Router::runPipeline()` just
reads that back — no reflection at request time at all.

**When this actually skips re-compiling across requests, not just within
one**: in `app.php`'s `env: 'local'` (the default), `Runner::routes()`
recompiles fresh every request — edit a controller's attributes and the
very next request reflects it, no cache to clear. In any other `env`,
the first request writes the compiled table to `storage/routes.cache.php`;
every request after that just `require`s the file directly, so
`RouteCompiler`/Reflection never runs again until you delete it (do that
after deploying a routing change).

## app.php and module references

[app.php](app.php) is the one manifest — name/version/env, plus the
`modules` list the `Kernel` boots, in order:

```php
return [
    'name' => 'api-pro',
    'version' => '1.0.0',
    'env' => $_ENV['APP_ENV'] ?? 'local',
    'base_path' => __DIR__,

    'modules' => [
        '@pro-sql' => '1.0.0',
        '@session' => '1.0.0',
        '@tester' => '1.0.0',
        Application::class,
    ],
];
```

A module entry is one of:

- **`'@name' => 'version'`** — always resolved from `packages/<name>`,
  never anywhere else. `ApiPro\PackageResolver` reads
  `packages/<name>/composer.json`, checks its `version` matches exactly
  (booting fails loudly on a mismatch — e.g. you bumped
  `packages/pro-sql/composer.json` to `1.1.0` but `app.php` still says
  `'@pro-sql' => '1.0.0'`), and derives the module class from that
  package's PSR-4 namespace by convention: a package autoloading `Foo\\`
  is expected to declare `Foo\FooModule` — exactly how `ProSql\ProSqlModule`
  and `Session\SessionModule` are already laid out. The resolved module is
  built with **no constructor arguments** — `ProSqlModule`/`SessionModule`
  are self-configuring, reading their config via `Runner::get('prosql')`/
  `Runner::get('session')` (loaded once by `runner/runner.php`, before
  `Kernel::boot()` runs — see "runner/ and ApiPro\Runner" below). A plain
  `Application::class` entry alongside these gets an ordinary integer
  array key, same as any normal list value — PHP arrays mixing string and
  integer keys are what makes this work in one `modules` array.
- **A plain class-string** (e.g. `Application::class`) — for your own
  app-level module, which isn't a `packages/` dependency and so isn't a
  package reference. Built with `new $class()`.
- **An already-built `Module` instance** — for the rare case a module
  genuinely needs constructor arguments the environment can't supply.

## Middleware — declared on the controller

`#[Middleware(...)]` is an attribute, so the chain a controller (or a single
action) runs through is declared right where the controller is, the same
spot you'd put `#[RestController]`. Each entry is either a plain
class-string (built with its constructor defaults) or — since PHP 8.1 allows
`new` inside attribute arguments — a configured instance:

```php
use ApiPro\Attributes\GetMapping;
use ApiPro\Attributes\Middleware;
use ApiPro\Attributes\RestController;
use Session\SessionMiddleware;

#[RestController(prefix: '/health')]   // combines with Application::prefix() below -> /api/health
#[Middleware(new SessionMiddleware(mandatory: true))]   // class default is also true
class HealthController
{
    #[GetMapping]
    public function status(Request $request): array { ... }   // requires an existing session

    #[GetMapping('/ping')]
    #[Middleware(new SessionMiddleware(mandatory: false))]     // overrides the class-level one for THIS action only
    public function ping(Request $request): array { ... }     // reachable with no session at all
}
```

Note the `new` — `Session(mandatory: true)`/`SessionMiddleware(mandatory: true)`
without it isn't valid PHP (that's a function call, not object construction).
A method-level `#[Middleware(...)]` entry **replaces** a class-level one of
the *same middleware class* rather than stacking both — that's what makes
the `mandatory: false` override on `ping()` actually take effect instead of
still being blocked by the class-level `mandatory: true`.

List more entries to chain more middleware later —
`#[Middleware(SessionMiddleware::class, AuthMiddleware::class, ThrottleMiddleware::class)]`
— they wrap the controller action outermost-first. Each one implements
`ApiPro\MiddlewareInterface`:

```php
class AuthMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): mixed
    {
        // ...check something before...
        $result = $next($request);   // calls the next middleware, or the controller action
        // ...do something after $result exists...
        return $result;
    }
}
```

If your middleware needs config passed through an attribute like
`SessionMiddleware` does, give the *config* parameters (bool/string/int/...)
a default and give any *service* parameter a `= null` default too — PHP
constructs that instance directly (no container involved) when you write
`new YourMiddleware(...)` inside the attribute, so it never has its real
service filled in at that point. The Router detects this, pulls the scalar
config back out via reflection, and asks the container to build a fresh,
fully-wired instance from it (see `Router::resolveMiddleware()`) — that's
also why `SessionMiddleware`'s `Session $session` parameter defaults to
`null` and is only ever read through `handle()`, never at construction.

`Session\SessionMiddleware` is the working example. `mandatory: true` (the
default) means a request with no valid token gets rejected with `401`
("Token expired") before the controller ever runs; `mandatory: false` lets
it through regardless — the controller can still call `Session::create()`
itself (see `HealthController::ping()`). Either way, once `$next()` (the
controller) has run, the result is wrapped through `Session::response()` —
see "Using Session" below for what that actually does.

## Using ProSql for MySQL

Every MySQL feature goes through `ProSql\Connection` / `ProSql\QueryBuilder`
/ `ProSql\Repository` — nothing in `src/` should touch `PDO` directly.

**Quick queries**, inject `ProSql\Connection` wherever you need it (the
container autowires it):

```php
use ProSql\Connection;
use ProSql\QueryBuilder;

class UserService
{
    public function __construct(private readonly Connection $db) {}

    public function activeAdmins(): array
    {
        return QueryBuilder::make($this->db)
            ->table('users')
            ->where('is_active', '=', 1)
            ->where('role', '=', 'admin')
            ->orderBy('created_at', 'DESC')
            ->limit(20)
            ->get();
    }
}
```

**Repository pattern** for a table's full CRUD, extend `ProSql\Repository`:

```php
namespace App\Repositories;

use ProSql\Repository;

class UserRepository extends Repository
{
    protected string $table = 'users';
    protected string $primaryKey = 'id';

    public function findByEmail(string $email): ?array
    {
        return $this->query()->where('email', '=', $email)->first();
    }
}
```

Then type-hint `UserRepository` in a service/controller constructor — the
container builds it (and its `Connection` dependency) automatically.

Configure credentials in `.env` (copy from `.env.dev`) —
[runner/prosql.php](runner/prosql.php) reads `DB_HOST`/`DB_PORT`/
`DB_DATABASE`/`DB_USERNAME`/`DB_PASSWORD`/`DB_CHARSET`, and `ProSqlModule`
binds a `Connection` singleton with `Runner::get('prosql')` when
`'@pro-sql' => '1.0.0'` boots.

## Using Session — a stateless, JWT-style token

`Session` is **not** native `$_SESSION` — nothing is stored server-side.
Everything a session needs travels inside a compact, HMAC-signed string the
client sends back on every request as `Authorization: Bearer <token>` (a
`session_token` cookie also works). Config-first, in
[runner/session.php](runner/session.php) — `SessionModule` builds this
when `'@session' => '1.0.0'` boots:

```php
// runner/session.php
return [
    'secret' => $_ENV['SESSION_SECRET'] ?? 'change-me-in-.env',
    'ttl' => (int) ($_ENV['SESSION_TTL'] ?? 3600),        // seconds a token stays valid
    'refresh_ttl' => (int) ($_ENV['SESSION_REFRESH_TTL'] ?? 1_209_600),
    'version' => (int) ($_ENV['SESSION_VERSION'] ?? 1),    // bump to invalidate every token at once
    'enc' => filter_var($_ENV['SESSION_ENC'] ?? false, FILTER_VALIDATE_BOOLEAN),
];

// SessionModule::register()
SessionConfig::fromArray(Runner::get('session'));
```

A decoded token (`Session\SessionToken`) always has `id`, `createdAt`,
`expireAt`, `version`, and a `data` array. On the wire, that `data` is
carried as a plain `data` field when `enc` is `false` (the default), or —
when `enc` is `true` — AES-256 encrypted and carried as `enc` instead
(`data` never appears in the clear on the wire in that mode).

When `enc` is `true`, every `Session::create($id, $data)` call — including
calling it again to refresh/re-issue a session — generates a fresh, random
10-digit `encKey` for that token (`SessionToken::$encKey`). That key travels
in cleartext alongside `enc` (it's a diversifier, not a secret by itself)
and gets mixed with `secret` to derive the actual AES key for that one
token — so encryption isn't done with one static key for every session,
and refreshing a session (calling `create()` again) always rotates it. A
token decoded back via `resolve()` carries its own `encKey` forward, so
re-encoding it later (e.g. in `response()`) reuses the same one rather than
rotating on every single response.

Inject `Session\Session` — bound as a singleton, so it holds "the current
token" for the whole request — wherever you need it:

```php
use Session\Session;

class AuthController
{
    public function __construct(private readonly Session $session) {}

    #[PostMapping('/login')]
    public function login(Request $request): array
    {
        $user = /* ...verify credentials... */;

        $this->session->create((string) $user['id'], ['role' => $user['role']]);

        return ['status' => 'LOGGED_IN'];   // SessionMiddleware attaches the token to this
    }
}
```

- **`Session::create($id, $data = [])`** — issues a brand-new token and
  makes it "current" (so the middleware's `response()` call afterwards
  encodes and attaches it).
- **`Session::resolve($token)`** — decodes + verifies an incoming compact
  token string (this is what `SessionMiddleware` calls before your
  controller runs). Returns `null` — and clears "current" — for a bad
  signature, malformed payload, wrong `version`, past `expire_at`, or (when
  `enc` is on) a failed decrypt. Every one of those comes back exactly the
  same way, whether you're calling it on a primary token or something
  you're using as a refresh token — there's no case where a broken `enc`
  blob leaks through as partial data instead of just being treated as
  expired.
- **`Session::response($packet)`** — merges an `ApiPro\Packet`'s data into
  the current token, re-encodes it, and returns the same `Packet` with
  `token` attached via `Packet::with('token', ...)`. No current token
  (nothing created/resolved this request) just returns the packet as-is,
  with no token — a route that never needed a session isn't forced to
  carry one.
- **`Session::logout()`** — drops the current token, so the response that
  follows carries none. Since this is stateless, it can't reach out and
  invalidate a token already in a client's hands — to kill every
  outstanding token at once, bump `SESSION_VERSION` in `.env` instead;
  `resolve()` rejects anything signed with an older version.

`SessionMiddleware` does the `resolve()` → (mandatory check) → `$next()` →
`response()` sequence for you; you only need `Session` directly for
`create()`/`logout()` (and to read `current()`) from inside a controller.

## Using Packet — a uniform response shape

`ApiPro\Packet` builds a consistent `{ success, message, data }` body, and
it's the **only** shape `ApiPro\Response::json()` accepts — its signature is
`json(Packet $packet, int $status = 200)`, not `mixed`. Every response that
goes through `Response::json()` — a controller's own explicit call, a 404,
a 400 from `InputBag`, a 401 from `SessionMiddleware` — is a `Packet`.

`success()`/`failed()` are fluent (they return `$this`, mutating the same
`Packet`), `with($key, $value)` attaches an extra top-level field (that's
how `Session::response()` adds `token` without breaking the fixed shape),
and `message()`/`data()`/`isSuccess()` read back whatever was last set. You
can still build one by hand this way, but see `PacketSuccess`/`PacketFailed`
below for the two shapes you'll actually reach for day to day.

A controller action can return either a plain value (an array, a scalar) or
a `Packet` directly — `Kernel::handle()` passes a `Packet` through as-is,
and wraps anything else in `Packet::success()` exactly once. **Never call
`->toArray()` on a `Packet` you're returning from a controller** — that
hands back a plain array instead of a `Packet`, which `Kernel` then wraps
in a *second*, outer `Packet`, double-nesting the response. `->toArray()`
only belongs right where `Response::json()` itself calls it.

### PacketSuccess and PacketFailed — no `Response::json()` needed

`PacketSuccess` and `PacketFailed` are the two shapes you actually write:

```php
use ApiPro\PacketFailed;
use ApiPro\PacketSuccess;

#[GetMapping('/{id}')]
public function show(Request $request): array
{
    $user = $this->userService->find($request->params->getInt('id'));

    if ($user === null) {
        throw new PacketFailed('User not found', 404);
    }

    return $user;   // plain array — Kernel wraps it in Packet::success() for you
}

#[PostMapping]
public function store(Request $request): Packet
{
    return new PacketSuccess(['mail' => $request->body->getMail('mail')], 'Validated');
}
```

- **`PacketSuccess($data, $message = 'Success')`** — a named constructor for
  the success half of `Packet` (`return new PacketSuccess($data, 'msg')`
  instead of `return (new Packet())->success($data, 'msg')`). It's still
  just a `Packet` — only reach for it when you want a custom message; a
  plain array/scalar return already auto-wraps for free.
- **`PacketFailed($message, $status = 400, $data = null)`** — throw this
  from *anywhere* — a controller, a middleware, `InputBag`'s own
  validation, `Router`'s "not found" fallback — to fail a request with a
  real HTTP status, with **no `Response::json()` call at all**.
  `Kernel::handle()` catches `PacketFailed` in exactly one place and
  converts it to the matching `{success:false,...}` response with that
  status — the same "auto convert" `Kernel` already does for a plain
  return value, just for the failure side. Being a real exception, it
  propagates through any number of middleware layers on its own (e.g. a
  controller throwing it skips `SessionMiddleware`'s token re-attachment
  entirely, the same as the old `Response::json()` + `exit` did) — nothing
  in between needs to catch or rethrow it.

## Using Page — a complete HTML page

`ApiPro\Page` is `Packet`'s counterpart for actual web pages instead of a
JSON API — a fluent builder for a full `<!doctype html>` document,
instead of hand-writing markup in a string inside a controller:

```php
use ApiPro\Page;

#[GetMapping('/dashboard')]
public function dashboard(Request $request): Page
{
    return (new Page())
        ->title('Dashboard')
        ->style('body { font-family: sans-serif; }')
        ->body('<h1>Hello</h1>')
        ->script('console.log("loaded");');
}
```

Return a `Page` and `Kernel::handle()` renders it and sends it as
`text/html` automatically — the same way returning a `Packet`/plain value
gets sent as JSON. Call `->send($status)` directly instead if you want to
write the response and stop right there, same as `Response::json()`.

`title()`/`lang()` are HTML-escaped; `body()` is **not** — that's the
point of a `Page`, you're writing markup there, not text. `style()`/
`script()` are additive (call them more than once to add more blocks).

The actual `<!doctype html>` skeleton isn't baked into the PHP class — it
lives in **[lib/page.html](lib/page.html)** (project root, never
web-reachable — `.htaccess` forbids it, only `Page::render()` reads it),
with `{{lang}}`/`{{title}}`/`{{styles}}`/`{{body}}`/`{{scripts}}`
placeholders. Edit that file to change every page's base layout at once
(add a shared nav bar, a global stylesheet link, etc.) without touching
`Page.php` — it falls back to an identical built-in template if that file
is ever missing or deleted.

### View mode — a complete page written in PHP, with real data

For a page that needs more than a title/body string — actual PHP logic,
loops, real variables — skip the placeholder template entirely with
`view()` + `props()`:

```php
#[GetMapping]
public function home(Request $request): Page
{
    return (new Page())
        ->view('HomePage')                              // lib/page/HomePage.php
        ->props(['posts' => $this->postService->all()]); // -> real $posts variable in that file
}
```

`view('HomePage')` points at **`lib/page/HomePage.php`** — a plain PHP
file where you write the *entire* document yourself, doctype included
(`title()`/`body()`/`style()`/`script()` are ignored once `view()` is
set — there's no placeholder template to fill in anymore, the view file
*is* the page). `props()` are `extract()`-ed into that file's own scope as
real local variables — the same convention as any PHP templating
approach (Laravel's `view($name, $data)`, plain PHP includes, etc.):

```php
<?php
use ApiPro\Page;
/** @var list<array{id: int, text: string, createdAt: string}> $posts */
?>
<!doctype html>
<html lang="en">
<body>
  <ul>
    <?php foreach ($posts as $post): ?>
      <li><?= Page::html($post['text']) ?></li>
    <?php endforeach; ?>
  </ul>
</body>
</html>
```

**`Page::html($value)`** is a small `htmlspecialchars()` wrapper for
exactly this — escaping a prop's value when you output it inside a view
file. Nothing forces you to use it (it's plain PHP; `echo`/`<?=` work
however you write them), but reach for it on anything that isn't a
literal you wrote yourself, the same reason you'd escape output in any
templating layer.

**[`/api-pro`](src/Controllers/HomeController.php)** is a full working
example of this: `HomeController` renders `lib/page/HomePage.php` with a
real list of posts as props, and the page's own JS `POST`s a new one to
`createPost()` (`/api/api-pro/posts`) and appends the result to the DOM —
a genuine interactive page, not just static markup. `PostService` behind
it is in-memory, the same demo-only limitation `UserService` already has
(no persistence across requests) — swap it for a real `ProSql\Repository`
to make posts durable.

## Validating input with InputBag

`$request->query`, `$request->body`, and `$request->params` (route
placeholders like `/{id}`) are all an `ApiPro\InputBag` — plain array
access (`$request->params['id']`) still works, but each also has typed,
validating getters: `getString`, `getInt`, `getFloat`, `getBool`,
`getArray`, `getJson`, `getMail`, `getPassword`.

```php
use ApiPro\Packet;

#[PostMapping]
public function store(Request $request): Packet
{
    $mail = $request->body->getMail('mail');            // required (email-format checked)
    $password = $request->body->getPassword('password'); // required (non-empty checked)
    $roles = $request->body->getJson('roles', []);        // optional — [] if absent
    $language = $request->query->getString('lang', 'en'); // optional query string value

    return (new Packet())->success([...], 'Validated');   // return the Packet, not ->toArray()
}
```

The rule is the same for every getter except `getMail`/`getPassword`:
**omit the second argument (or pass `null`) and the key is mandatory** —
missing, or present with the wrong type, fails the whole request with a
`400` `Packet` before your controller body runs any further. Pass anything
else as the default — `''`, `0`, `false`, `[]` all count — and it's
optional; that's what comes back when the key is absent. `getMail`/
`getPassword` take a `required: bool` (default `true`) instead of a
default value, since there's no sensible "default" email or password.

`getInt`/`getFloat`/`getBool` accept sensibly-typed strings too (route
placeholders and query values always arrive as strings) — `"42"` passes
`getInt`, `"true"`/`"1"` pass `getBool` — but reject anything that isn't
actually that type (`"abc"` on `getInt` still 400s). `getJson` accepts
either an already-decoded array (a nested body field) or a string
containing valid JSON.

## Using Tester — a Swagger-like API explorer

Visit **`/tester`** (e.g. `http://127.0.0.1:7070/tester`) for an
interactive explorer: every route in your API (not `/tester`'s own two —
those are filtered out as the tool's own plumbing, not something to try
out), grouped into a collapsible list **per controller** (click a
controller's name to fold/unfold its routes — they start expanded), with
a form for path params/query string/JSON body/a Bearer token, and a
"Send" button that calls the real endpoint via `fetch()` (same-origin —
no proxy, no CORS setup needed) and shows the actual status code +
response body.

Paths are shown at three levels, each trimmed to just what's new at that
level:

- **Header**: the base path shared by *every* route (e.g. `/api`), next
  to the title — computed client-side as the longest leading path
  segment common to every route (`commonPrefix()`), never hardcoded.
- **Controller group**: that controller's own segment, with the app's
  base path stripped off (e.g. `HealthController` shows `/health`, not
  `/api/health`) — this one is *not* guessed from paths: `RouteCompiler`
  sends the controller's real declared prefix (module prefix +
  `#[RestController(prefix: ...)]`) as `route.prefix`, so it's exact even
  for a controller with only one route (diffing paths against themselves
  would be ambiguous there — there's nothing to diff against).
- **Each route row**: just the remainder after both of those (e.g.
  `/logout`, `/{id}`, or `/` for a controller's own base route) — never
  the full path repeated at every level.

Opening a route's form panel still shows the **full** real path in its
heading (e.g. `POST /api/health/logout`) — that's the request you're
about to send, so it stays unambiguous there even though the list next
to it stays short.

It's driven entirely by `Runner::routes()` — the exact same compiled table
`Router` dispatches from (see "Endpoints are compiled once" above) — via
one JSON endpoint, `GET /tester/routes`. The page itself
(`packages/tester/resources/index.html`) is a single self-contained
HTML/CSS/JS file: no build step, no CDN, nothing to install.

```php
// TesterModule::controllers() — gates the whole thing on one config key
public function controllers(): array
{
    return $this->enabled() ? [TesterController::class] : [];
}
```

Controlled by [runner/tester.php](runner/tester.php) (`Runner::get('tester')['enabled']`,
`TESTER_ENABLED` in `.env`) — **enabled by default**, since it's meant as a
dev convenience. Set `TESTER_ENABLED=false` before deploying somewhere
`/tester` shouldn't be publicly reachable: it doesn't bypass any
auth/validation (it just builds the same requests you could craft with
curl), but it does hand out your full endpoint list to anyone who visits it.

### Fields are shown as per your `InputBag` calls — required `*`, optional

Instead of one freeform "Query string" box and one raw "Body (JSON)"
textarea for every endpoint, the explorer looks at what a method actually
reads through `InputBag` and shows one labeled input per field, with a
red `*` for required and `(optional)` for the rest, plus a small type
badge (`Email`, `Password`, `JSON`, `Integer`, ...):

```php
#[PostMapping]
public function store(Request $request): Packet
{
    $mail = $request->body->getMail('mail');             // shown: mail *  (Email)
    $password = $request->body->getPassword('password');  // shown: password *  (Password)
    $roles = $request->body->getJson('roles', []);         // shown: roles (optional)  (JSON)
    $language = $request->query->getString('lang', 'en');  // shown: lang (optional)  (String)
    ...
}
```

`RouteCompiler::fieldsOf()` finds these the same way `Tester::comment()`
is found — reading the method's own source text and tokenizing it, never
executing it — matching `InputBag`'s own required/optional rule exactly:
for `getMail`/`getPassword`, required unless the second argument is
literally `false`; for every other getter, required unless a second
argument is given at all (a bare `null` still counts as none). Only a
call whose key is a plain string literal is recognized. `$request->params->getX(...)`
calls are skipped here — those are `{id}`-style route placeholders,
already shown as path-param inputs.

When you click **Send**, a blank *optional* field is left out of the
request entirely (so the endpoint's own default applies); a blank
*required* one is still sent, so you see the real backend validation
message instead of the tester guessing. A `JSON`/`Array` field's text is
parsed before sending — `getJson('roles', [])` needs an actual array in
the request body, not a JSON-encoded string sitting inside it.

If nothing is detected for a route's query or body (an endpoint that
doesn't use `InputBag`, or a dynamic key that can't be read from source
text), the explorer falls back to the original freeform input for that
one — nothing is lost, only endpoints that used to have a blank canvas
now get one field per key instead.

### A per-endpoint README — `Tester::comment(...)` inside the method

Write it as the first line of a mapped method's body, and it shows up
verbatim in the explorer, the same idea as Swagger's operation
description:

```php
use Tester\Tester;

#[GetMapping('/{id}')]
public function show(Request $request): array
{
    Tester::comment("Fetch one user by numeric id.\nReturns 404 if no user with that id exists.");
    ...
}
```

**This call does nothing at runtime.** The only way to read something
written *inside* a method body without executing that method (with all
its real side effects) first is to read the method's own **source
text** — so that's what `RouteCompiler::commentOf()` does: it takes the
method's start/end line numbers from Reflection, reads those exact lines
out of the file, tokenizes them with PHP's own tokenizer, and pulls out
the string literal argument to `Tester::comment(...)` — all without ever
calling it. `Tester::comment()` itself is a no-op that only exists so the
line is valid, harmless PHP for the real request that eventually reaches it.

The one real limitation that comes with reading source text instead of
running code: **the argument must be a plain string literal written right
there** — no variables, no concatenation, no interpolation, since it's
matched against the tokenized source, not evaluated. Escape sequences in
that literal (`\n`, `\"`, `\\`, etc.) are unescaped correctly either way.
In the UI the text is set via `textContent` (never `innerHTML`), so
nothing in it is parsed as HTML, and CSS `white-space: pre-wrap`
preserves every line break and space precisely as written. It's shown
behind a "▾ Description" toggle, **collapsed by default** — click to
reveal it. A method with no `Tester::comment(...)` call shows no toggle
or description block at all.

## Module route prefix

A `Module` can prepend a base path to every controller it contributes —
`App\Application` sets `/api` this way, so `HealthController`/`UserController`
only need to declare their own `/health`/`/users` (which combine to
`/api/health`, `/api/users`, etc.):

```php
class Application extends Module
{
    public function prefix(): string
    {
        return '/api';
    }

    // ...register()/controllers() as before
}
```

Override `prefix()` (it defaults to `''`) on any `Module` — the resulting
path is `module prefix + controller's own #[RestController(prefix: ...)] +
the method's #[GetMapping(...)]/etc. path`, in that order.

## Adding a new endpoint

1. Add a method to a controller in `src/Controllers/` (or a new controller
   class) with `#[RestController(prefix: '/...')]` on the class (it combines
   with the owning module's `prefix()` — see above) and
   `#[GetMapping]`/`#[PostMapping]`/etc. on the method. Add `#[Middleware(...)]`
   on the class or method if it needs to run through one.
2. If it's a new controller class, list it in
   [runner/controllers.php](runner/controllers.php) (what
   `App\Application::controllers()` reads from).
3. Need a dependency? Type-hint it in the controller's constructor — the
   container resolves it automatically. Register it as a singleton in
   `App\Application::register()` if it should only be built once.

## Adding a new module or middleware

Everything application-specific lives in `src/`, its controller list in
`runner/controllers.php`. For a new feature area, either add its
controllers there, or create a class extending `ApiPro\Module` and list it
in `app.php`'s `modules` array — as `'@name' => 'version'` if it's a new
package under `packages/` (give it its own `runner/<name>.php` config file
and read it via `Runner::get('<name>')`, per "runner/ and ApiPro\Runner"
above), or as a plain class-string/instance otherwise. For a new
middleware, implement `ApiPro\MiddlewareInterface` and reference its
class-string in a controller's `#[Middleware(...)]`.

## apc — the CLI

`php apc <command>` (or `./apc <command>` — it's executable) is this
project's CLI, the same idea as Laravel's `artisan`: operational commands
that sit next to the app instead of behind an HTTP route. It boots
`ApiPro\Runner` exactly the way `index.php` does — same module resolution,
same route-caching rules — so what it reports is what a real request
would actually get, not a separate config path.

```bash
php apc -v                        # app + every packages/* package's name and version
php apc start                     # clean + rebuild, then start PHP's built-in server at 127.0.0.1:7070
php apc start 8081                 # ...same, but on 127.0.0.1:8081
php apc build                     # just the build step — force-compiles every module's routes, writes storage/routes.cache.php
php apc build -c, --clean         # deletes that cache file
php apc install                    # validates every app.php module reference actually resolves
php apc install 1.0.0              # ...and that app.php's own 'version' equals 1.0.0
php apc module pro-sql             # shows packages/pro-sql's version + whether/how app.php references it
php apc module pro-sql 1.0.0       # ...and validates packages/pro-sql's composer.json version equals 1.0.0
```

`start` is the everyday dev-loop command: it always clears any existing
`storage/routes.cache.php` and recompiles fresh before binding PHP's
built-in server in the foreground (`Ctrl+C` to stop) — so it's never
possible to start the server against a stale build, whatever `env` says.
`build` alone (without `start`) is for when you want just the compile step
— e.g. as a separate step in a deploy script, ahead of whatever actually
serves the app there (Apache/nginx+FPM, not this built-in server).

`install` and `module` are **read-only diagnostics** — they report
mismatches (exit code `1`) rather than ever rewriting `app.php` or a
package's `composer.json` themselves; editing either is still a manual,
reviewed change. `build` is exactly what it sounds like — the same role as
`npm run build` or Laravel's `route:cache`: a deploy-time step, run once
ahead of traffic, right before you switch `app.php`'s `env` away from
`local` — see "Endpoints are compiled once, not re-scanned per dispatch"
above for why that matters outside `env: local`. Add a new command by
adding an `ApiPro\Cli\Command` implementation under `packages/api-pro/Cli/`
and listing it in `Application::COMMANDS`.

## Running it

```bash
cp .env.dev .env           # then fill in real DB_* credentials and a real SESSION_SECRET
composer install            # resolves all 4 packages via path repos, writes vendor/autoload.php
php apc start                # clean build, then serves at 127.0.0.1:7070 — Ctrl+C to stop
# or point an Apache vhost's DocumentRoot at this folder (mod_rewrite enabled) to use .htaccess
```

This has been verified end-to-end (PHP 8.5, `composer install`, every
`apc` command, and every curl example below) — all of it ran and returned
exactly what's documented.

Then, walking through the token lifecycle:

```bash
curl -i localhost:7070/api/health
# 401 "Token expired" — no token yet, and this route requires one (mandatory: true)

TOKEN=$(curl -s localhost:7070/api/health/ping | php -r 'echo json_decode(file_get_contents("php://stdin"), true)["token"];')
# 200 — mandatory: false override; Session::create() issues a token, response() attaches it

curl -i -H "Authorization: Bearer $TOKEN" localhost:7070/api/health
# 200 now — the token from /ping resolves successfully

curl -i -X POST -H "Authorization: Bearer $TOKEN" localhost:7070/api/health/logout
# 200, but with no "token" in the body — Session::logout() dropped it

curl localhost:7070/api/users
curl localhost:7070/api/users/1
curl -X POST localhost:7070/api/users \
  -H 'Content-Type: application/json' -d '{"mail":"test@apipro.com","password":"secret"}'
# 200, {success:true, ...} — try omitting "mail", or "mail":"not-an-email", to see the 400 Packet
```

(This particular pairing — a "health check" that requires a token — is
purely to demonstrate `mandatory`/`Session::create()`/`Session::logout()` in
one place; a real health-check endpoint should stay reachable with no
middleware at all.)
