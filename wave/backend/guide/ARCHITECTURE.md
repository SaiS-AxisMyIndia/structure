# Backend architecture guide

NestJS service for **gerogo**. This file documents the structure and conventions the
codebase follows — read it before adding a new module, integration, or route so new
code lands in the right place and matches what's already here.

## Directory structure

```
src/
├── app.module.ts              composition root only - see "Composition root" below
├── main.ts                    bootstrap: global ValidationPipe, PacketInterceptor/Filter
├── core/                      the app's actual features
│   ├── app/                   one example feature module (see "Feature modules")
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   ├── app.repo.ts
│   │   ├── app.module.ts
│   │   └── app.controller.spec.ts
│   └── auth/                  login/OTP feature - controller/service/repo only,
│       │                      its @Module lives in config/modules/ instead (see below)
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       └── auth.repo.ts
└── config/                     3rd-party integrations & shared infra, one folder each
    ├── features.config.ts     FeaturesConfig - see "Feature configuration" below
    ├── flavour/
    │   └── flavour.ts         Flavour (dev/uat/prod) - see "Flavour" below
    ├── utils/
    │   └── numberFormatter.ts NumberFormatter.randomOtp() - dependency-free helpers,
    │                          same shape as the frontend's own config/utils/*Formatter.ts
    ├── auth/
    │   ├── token.service.ts   sign/verify access+refresh JWTs
    │   └── token.module.ts    @Global() - exports TokenService + JwtAuthGuard
    ├── guards/
    │   └── jwt-auth.guard.ts  registered as the global APP_GUARD
    ├── decorators/
    │   ├── public.decorator.ts       @Public() - opt a route out of the guard
    │   └── current-user.decorator.ts @CurrentUser() - read the decoded token
    ├── database/
    │   ├── database.module.ts    TypeOrmModule.forRoot - see "Database" below
    │   └── entities/              @Entity() classes, grouped here rather than per-feature
    ├── modules/
    │   └── auth.module.ts        core/auth's @Module - see "Feature modules" below
    ├── http/
    │   ├── packet.ts               Packet<T> - see "Response envelope" below
    │   ├── packet.interceptor.ts   wraps every success in Packet.success(...)
    │   └── packet.filter.ts        wraps every thrown error in Packet.failed(...)
    ├── razorpay/               RazorpayService (stub)
    ├── mail/                   MailService + MailTemplates (stub)
    ├── sms/                    SmsService + SmsTemplates (stub)
    └── middlewares/            RequestLoggerMiddleware, applied globally
```

## The core/config split

- **`core/`** is where the app's actual features live. Each feature's
  controller/service/repo sit under `core/<feature>/`.
- **`config/`** is where 3rd-party integrations and shared cross-cutting infra
  (including auth/token handling - `config/auth/`, `config/guards/`,
  `config/decorators/`, `config/database/`) live, each as a self-contained Nest module a
  `core/` service injects. `core/` never talks to a 3rd-party SDK directly — always
  through a `config/` service, so swapping providers or mocking one in a test only ever
  touches that one file.
- **`config/modules/`** holds a feature's `@Module` declaration when it's kept separate
  from that feature's own `core/<feature>/` folder (see `core/auth/` above - its
  controller/service/repo live in `core/auth/`, but `CoreAuthModule` itself is
  `config/modules/auth.module.ts`). `core/app/` still keeps its module colocated
  (`core/app/app.module.ts`) - both are valid, pick whichever a new feature's own
  `core/<feature>/` folder already looks like.

## Feature modules: controller → service → repo

Every feature under `core/` follows the same three-layer split (see `core/app/` and
`core/auth/` as worked examples):

- **Controller** — routes only. Wires HTTP verbs to service calls, applies guards
  (`@Public()` to opt out of the global `JwtAuthGuard` — see below), and declares
  request validation via DTOs. **No business logic here.**
- **Service** — all business logic. Calls the feature's own repo for data, and any
  `config/` integration it needs (Razorpay, mail, SMS, ...). This is the layer other
  services call into, and the layer unit tests should target.
- **Repo** — the only layer allowed to know how data is actually stored. `core/auth/
  auth.repo.ts` is the first repo backed by a real DB (TypeORM repositories injected via
  `@InjectRepository` - see "Database" below); `core/app/app.repo.ts` still returns
  static data. Either way, only the repo's method bodies know this - service/controller
  never do.

To add a new feature: create `core/<feature>/{<feature>.controller,service,repo}.ts`
following `core/app/`'s or `core/auth/`'s shape, its `@Module` either alongside them
(`core/<feature>/<feature>.module.ts`) or under `config/modules/<feature>.module.ts`,
then import that module into `app.module.ts`.

## Auth: token/session handling

- `TokenService` (`config/auth/token.service.ts`) signs and verifies JWTs. Access
  and refresh tokens use **separate secrets** (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`,
  falling back to insecure dev defaults if unset — set real ones outside development)
  and separate expiries (`JWT_ACCESS_EXPIRES_IN` default `15m`, `JWT_REFRESH_EXPIRES_IN`
  default `30d`), so a leaked access token can't be replayed as a refresh token.
  `issueSession()` returns `{ accessToken, refreshToken }` — the same shape the
  frontend's OTP login flow expects, and what `core/auth/auth.service.ts` actually
  returns on a successful `verify-otp`.
- `JwtAuthGuard` is registered as the **global** `APP_GUARD` in `app.module.ts` — every
  route requires a valid `Authorization: Bearer <token>` header by default.
- Mark a route `@Public()` (see `config/decorators/public.decorator.ts`) to skip
  the guard — needed for login/generate-otp/verify-otp/health-check style routes that
  must be reachable without a token yet.
- Read the decoded payload in a protected route with `@CurrentUser() user: TokenPayload`.

## Flavour

`config/flavour/flavour.ts` exports `Flavour` (`value()`, `isDev()`, `isUat()`,
`isProd()`) - which of **dev/uat/prod** this instance is running as, read from the
`APP_ENV` env var (defaulting to `dev` when unset). Same three-value shape as the
frontend's own `config/flavour/flavour.ts`, but a separate, independent read - this is
its own process with its own env vars, not something the two share.

Use it to gate anything that should behave differently per environment - e.g.
`DatabaseModule`'s `synchronize` (see "Database" below) is `!Flavour.isProd()`, never
auto-syncing schema in a real deployment.

## Feature configuration

`config/features.config.ts` exports a single `FeaturesConfig` object - the one place
tunable feature settings live, instead of being hardcoded inline at each call site
(e.g. `core/auth/auth.service.ts`'s own OTP consts, before this existed). Every field
has a working default so the app runs unconfigured in dev; set the matching env var to
override one anywhere else:

| `FeaturesConfig` field | Env var | Default | Used by |
|---|---|---|---|
| `otp.length` | `OTP_LENGTH` | `4` | `NumberFormatter.randomOtp()` (`config/utils/numberFormatter.ts`), called from `AuthService.generateOtp` - also the digit range generated, not just validated |
| `otp.ttlMs` | `OTP_TTL` (a duration string, e.g. `5m` - parsed via the `ms` package) | `5m` | `AuthService.verifyOtp` - expiry check |
| `otp.maxAttempts` | `OTP_MAX_ATTEMPTS` | `3` | `AuthService.verifyOtp` - lockout check |
| `mailer` | `MAILER_FROM` | `example@test.com` | `MailService.send` - the "from" address once a real provider replaces the stub |

Add a new tunable the same way: a field on `FeaturesConfig` reading its own env var
with a default, not a bare `process.env.X` at the call site.

## Database

`config/database/database.module.ts` registers a single `TypeOrmModule.forRoot()` using
**`better-sqlite3`** - a local file (`DB_PATH` env var, default `data/dev.sqlite`), no
external server to run. It's deliberately generic (no entity list of its own):
`autoLoadEntities: true` picks up whatever entities each feature module registers via
its own `TypeOrmModule.forFeature([...])` (see `config/modules/auth.module.ts`).

Entity classes live under `config/database/entities/` (not per-feature under `core/`) -
e.g. `auth.entity.ts` (`auth` table) and `auth-otp.entity.ts` (`auth_otp` table). A
feature's repo (`core/<feature>/<feature>.repo.ts`) injects the `Repository<T>` it needs
with `@InjectRepository(SomeEntity)`.

`synchronize: !Flavour.isProd()` (see "Flavour" above) auto-creates/updates tables from
the entities on every boot in dev/uat - fine there since there's no migration tooling
yet, but never in prod, where it's turned off unconditionally (it can silently
drop/alter columns on a schema change - real migrations should replace this once they
exist, for every environment).

## Response envelope: Packet

Every response this API sends - success or thrown error - goes out shaped as a
`Packet` (`config/http/packet.ts`), matching the frontend's own `DataResponse` (see
`frontend/src/config/network/data_response.ts`) so `SecureCall` can unwrap it without
any per-route special-casing:

- `Packet.success(data, message?, httpStatus = 200)` / `Packet.failed(message,
  errorCode?, httpStatus = 200)` build the wire body. `httpStatus` is a transport
  concern, not a body field - it's stripped before anything is serialized.
- **`PacketInterceptor`** (global, registered in `main.ts`) auto-wraps a controller's
  plain return value in `Packet.success(data)` - most routes just return their result
  and never touch `Packet` directly (see `core/auth/auth.controller.ts`). A route that
  wants a non-200 success status can instead return `Packet.success(data, 'Created',
  201)` itself.
- **`PacketExceptionFilter`** (global, registered in `main.ts`) catches everything a
  guard/pipe/service throws and formats it as `Packet.failed(...)`, preserving the real
  HTTP status (a thrown `UnauthorizedException` still sends a real 401, etc.) - the
  frontend's own token-refresh flow depends on that real status code, so this never
  flattens every error to 200.

## Validation

`main.ts` registers a global `ValidationPipe({ whitelist: true, transform: true })`.
Basic validation means: give every request body its own DTO class with
`class-validator` decorators (`@IsString()`, `@IsOptional()`, ...) — the pipe enforces
them automatically, strips unknown fields, and turns the plain body into a real class
instance. Don't hand-roll validation in a controller/service.

## config/: adding a new 3rd-party integration

Follow the existing folders as the template: one directory per integration, with a
`<name>.service.ts` (the only thing anything else ever imports) and a
`<name>.module.ts` exporting it. `razorpay/` also has a `<name>.types.ts` for its
input/output shapes — add one whenever a service's methods take/return more than a
primitive.

**Everything currently in `config/` is a stub** — no 3rd-party npm packages are
installed yet:

| Integration | File | Real SDK to add | Env vars it will need |
|---|---|---|---|
| Razorpay | `razorpay/razorpay.service.ts` | `razorpay` | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` |
| Mail | `mail/mail.service.ts` | e.g. `nodemailer` | `MAIL_*` (provider-specific) |
| SMS | `sms/sms.service.ts` | e.g. a Twilio/MSG91 client | `SMS_*` (provider-specific) |

Each stub logs a warning and returns a plausible fake result instead of calling out —
wire the real SDK into that one file's method bodies when credentials exist; nothing
that calls the service needs to change.

Templates (`mail/mail.templates.ts`, `sms/sms.templates.ts`) are a name → `{ subject?,
render(data) }` map, kept separate from the service so a template's copy can change
without touching send logic.

## Middlewares

`config/middlewares/` holds cross-cutting request middleware (currently just
`RequestLoggerMiddleware`, logging one line per request after it finishes). Add a new
one as its own file in this folder and register it in `middlewares.module.ts`'s
`configure()` rather than wiring it into a feature module directly.

## Composition root

`src/app.module.ts` only imports modules and registers the global guard — it has no
controllers/services of its own. `config/` modules are imported before `core/` ones
since `core/` is expected to depend on `config/`, never the reverse.

## Testing

- Unit specs (`*.spec.ts`) live next to the file they test (see
  `core/app/app.controller.spec.ts`). Run with `npm run test`.
- E2E specs live in `test/` and boot the real `AppModule`. Run with `npm run test:e2e`.
- Both use Vitest, not Jest, despite the Nest CLI defaults suggesting otherwise.

## Debugging

`.vscode/launch.json` has four configs, all using VS Code's built-in JavaScript
debugger (`"type": "node"` - no extra extension needed, unlike the frontend's
Android/iOS configs):

- **Debug Nest (start:debug)** — launches `npm run start:debug` (`nest start --debug
  --watch`) under the debugger directly.
- **Attach to Nest process** — attaches to an instance already running in a terminal
  (`start:debug`'s default port, `9229`) instead of starting a second one.
- **Debug Unit Tests** / **Debug E2E Tests** — run `test:debug`/`test:e2e` with
  `--inspect-brk`, so a breakpoint in a `.spec.ts` file (or one hit via `test/`) stops
  execution before the suite starts running.

## Known gaps

- **Only `core/auth/` has a real database.** `core/app/app.repo.ts` still returns
  static data - see "Database" above for what a feature actually wired to TypeORM
  looks like.
- **SQLite, `synchronize` (dev/uat only), no migrations.** Fine for this stage - see
  "Database"'s own caveat on when to add real migrations.
- **No 3rd-party SDK is installed** for Razorpay/mail/SMS — see the table above.
  `generate-otp` calls the SMS stub (`SmsService.send`), which just logs the code
  instead of actually texting it - read it from the server log (or the `auth_otp`
  table directly) until a real provider is wired in.
