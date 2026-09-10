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
│   ├── user/
│   │   └── auth/               login/OTP/session feature - controller/service/repo,
│   │       │                   see "Feature modules" - its @Module lives in
│   │       │                   config/modules/ instead (see below)
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       └── auth.repo.ts
│   └── admin/
│       └── auth/               admin login/session - see "Admin auth" below. No
│                                auth.repo.ts of its own - reuses core/user/auth's
│                                AuthRepo (same auth/auth_otp/devices tables)
│           ├── auth.controller.ts
│           └── auth.service.ts
└── config/                     3rd-party integrations & shared infra, one folder each
    ├── features.config.ts     FeaturesConfig - see "Feature configuration" below
    ├── flavour/
    │   └── flavour.ts         Flavour (dev/uat/prod) - see "Flavour" below
    ├── utils/
    │   ├── numberFormatter.ts  NumberFormatter.randomOtp() - dependency-free helpers,
    │   │                       same shape as the frontend's own config/utils/*Formatter.ts
    │   └── contactFormatter.ts ContactFormatter.isEmail() - see "Login identifier" below
    ├── auth/
    │   ├── token.service.ts   sign/verify access+refresh JWTs
    │   └── token.module.ts    @Global() - exports TokenService + JwtAuthGuard
    ├── guards/
    │   └── jwt-auth.guard.ts  registered as the global APP_GUARD
    ├── decorators/
    │   ├── public.decorator.ts       @Public() - opt a route out of the guard
    │   └── current-user.decorator.ts @CurrentUser() - read the decoded token
    ├── database/
    │   └── database.module.ts    TypeOrmModule.forRoot - see "Database" below
    ├── entities/                  @Entity() classes, grouped here rather than per-feature
    ├── modules/
    │   ├── auth.module.ts         core/user/auth's @Module - see "Feature modules" below
    │   └── admin-auth.module.ts   core/admin/auth's @Module - see "Admin auth" below
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
  from that feature's own `core/<feature>/` folder (see `core/user/auth/` - its
  controller/service/repo live there, but `CoreAuthModule` itself is
  `config/modules/auth.module.ts`). A feature can also keep its module colocated
  instead (`core/<feature>/<feature>.module.ts`) - either is valid, pick whichever a
  new feature's own shape calls for.

## Feature modules: controller → service → repo

Every feature under `core/` follows the same three-layer split (see `core/user/auth/`
as the worked example):

- **Controller** — routes only. Wires HTTP verbs to service calls, applies guards
  (`@Public()` to opt out of the global `JwtAuthGuard` — see below), and declares
  request validation via DTOs. **No business logic here.**
- **Service** — all business logic. Calls the feature's own repo for data, and any
  `config/` integration it needs (Razorpay, mail, SMS, ...). This is the layer other
  services call into, and the layer unit tests should target.
- **Repo** — the only layer allowed to know how data is actually stored -
  `core/user/auth/auth.repo.ts` injects real TypeORM repositories (`@InjectRepository`
  - see "Database" below). Only the repo's method bodies know this; service/controller
  never do.

To add a new feature: create `core/<feature>/{<feature>.controller,service,repo}.ts`
following `core/user/auth/`'s shape, its `@Module` either alongside them
(`core/<feature>/<feature>.module.ts`) or under `config/modules/<feature>.module.ts`,
then import that module into `app.module.ts`.

## Auth: token/session handling

- `TokenService` (`config/auth/token.service.ts`) signs and verifies JWTs. Access
  and refresh tokens use **separate secrets** (`JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`,
  falling back to insecure dev defaults if unset — set real ones outside development)
  and separate expiries (`JWT_ACCESS_EXPIRES_IN` default `15m`, `JWT_REFRESH_EXPIRES_IN`
  default `30d`), so a leaked access token can't be replayed as a refresh token.
  `issueSession()` returns `{ accessToken, refreshToken }` internally -
  `core/user/auth/auth.service.ts`'s own `verify-otp` response renames these to
  `token`/`refreshToken` in its flat, non-`data`-nested shape (see "Response envelope"
  below).
- `TokenPayload` (what actually goes inside the JWT) is deliberately minimal - `{ id,
  role, did }` (the user's UUID, role, and the deviceId that logged in), never mail/
  phone/etc. A JWT is base64, not encrypted - anything encoded into it is readable by
  whoever holds the token, so it only ever carries what a protected route actually
  needs to identify the caller, not their profile data (that's what a real DB lookup
  via `@CurrentUser()`'s `id` is for). Both `signAccessToken`/`signRefreshToken` also
  set `notBefore: 0` so the decoded payload carries an explicit `nbf` (equal to `iat`)
  alongside the standard `iat`/`exp`.
- `validate-otp` reads the device's display name off an `x-device-name` request
  header (`@Headers('x-device-name')` in `AuthController.validateOtp`), not a body
  field - `deviceId` stays in the body since it's load-bearing for the OTP check
  itself, `deviceName` is just metadata for the `devices` row (see "Database" above),
  the same way a `User-Agent` header would be. Optional - a caller that doesn't send
  it just gets `name: null` on that row.
- `JwtAuthGuard` is registered as the **global** `APP_GUARD` in `app.module.ts` — every
  route requires a valid `Authorization: Bearer <token>` header by default.
- Mark a route `@Public()` (see `config/decorators/public.decorator.ts`) to skip
  the guard — needed for login/generate-otp/verify-otp/health-check style routes that
  must be reachable without a token yet.
- Read the decoded payload in a protected route with `@CurrentUser() user: TokenPayload`
  - `AuthController.logout`/`logoutAll` are the first callers, reading `user.id`/
    `user.did` straight off the token instead of taking them as request input.
- `AuthController`'s full route list: `generate-otp`/`validate-otp`/`refresh-token`
  are `@Public()`; `logout`/`logoutAll` are not (they need a real access token to know
  which `authId`/`deviceId` to act on).

## Admin auth

`core/admin/auth/` (`AdminAuthController`/`AdminAuthService`, routes under
`admin/v1/auth`) mirrors `core/user/auth/` route-for-route
(`generate-otp`/`validate-otp`/`refresh-token`/`logout`/`logoutAll`) but is a gate in
front of the **same** `auth`/`auth_otp`/`devices` tables, not a separate admin schema:

- It injects the exact same `AuthRepo` class from `core/user/auth/auth.repo.ts` - not
  a duplicate. `config/modules/admin-auth.module.ts` registers its own
  `TypeOrmModule.forFeature([...])` for the same three entities and its own `AuthRepo`
  provider (Nest allows a provider class to be registered in more than one module;
  each gets its own instance, all backed by the same DB tables - there's no shared
  state to worry about since `AuthRepo` is stateless).
- `generate-otp` and `validate-otp` both look the identifier up first and refuse with
  `"You are not authorized to access the admin panel."` unless an `auth` row already
  exists **and** `roles === AuthRole.ADMIN` - there's no self-service admin signup the
  way a first-time phone/email auto-creates a regular user (`AuthRepo.createProfile`
  is never called from here). Promoting an account to admin is a direct DB write for
  now (`UPDATE auth SET roles = 'admin' WHERE ...`) - no promote-to-admin endpoint
  exists yet.
- The issued token's `role` claim is the literal string `'admin'` (matching
  `core/user/auth`'s own `'user'`) - `refreshToken` re-checks `roles === AuthRole.ADMIN`
  on every refresh too, so a demoted account's existing refresh token stops working
  the same way a logged-out device's does (see "Database" above).

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
(e.g. `core/user/auth/auth.service.ts`'s own OTP consts, before this existed). Every field
has a working default so the app runs unconfigured in dev; set the matching env var to
override one anywhere else:

| `FeaturesConfig` field | Env var | Default | Used by |
|---|---|---|---|
| `otp.length` | `OTP_LENGTH` | `4` | `NumberFormatter.randomOtp()` (`config/utils/numberFormatter.ts`), called from `AuthService.generateOtp` - also the digit range generated, not just validated |
| `otp.ttlMs` | `OTP_TTL` (a duration string, e.g. `5m` - parsed via the `ms` package) | `5m` | `AuthService.verifyOtp` - expiry check |
| `otp.maxAttempts` | `OTP_MAX_ATTEMPTS` | `3` | `AuthService.verifyOtp` - lockout check |
| `otp.devCode` | `OTP_DEV_CODE` | `1234` | `AuthService.generateOtp` - used instead of a random code when `Flavour.isDev()` (see "Flavour" above), so a local login doesn't need the SMS stub's log line read every time |
| `mailer` | `MAILER_FROM` | `example@test.com` | `MailService.send` - the "from" address once a real provider replaces the stub |

Add a new tunable the same way: a field on `FeaturesConfig` reading its own env var
with a default, not a bare `process.env.X` at the call site.

## Database

`config/database/database.module.ts` registers a single `TypeOrmModule.forRoot()` using
**`better-sqlite3`** - a local file (`DB_PATH` env var, default `data/dev.sqlite`), no
external server to run. It's deliberately generic (no entity list of its own):
`autoLoadEntities: true` picks up whatever entities each feature module registers via
its own `TypeOrmModule.forFeature([...])` (see `config/modules/auth.module.ts`).

Entity classes live under `config/entities/` (not per-feature under `core/`) - e.g.
`auth.entity.ts` (`auth` table), `auth-otp.entity.ts` (`auth_otp` table), and
`device.entity.ts` (`devices` table, one row per `(authId, deviceId)` pair - see
AuthRepo.upsertDevice, called from AuthService.verifyOtp on every successful login). A
feature's repo (`core/<feature>/<feature>.repo.ts`) injects the `Repository<T>` it
needs with `@InjectRepository(SomeEntity)`.

`AuthEntity.id`/`DeviceEntity.id` are UUIDs (`@PrimaryGeneratedColumn('uuid')`), not
sequential auto-increment ints - `AuthEntity.id` is what's exposed everywhere outside
the DB (API responses, the JWT payload's own `id` claim - see "Auth: token/session
handling" below), so it can't leak row counts or be guessed.

`DeviceEntity.active` is what `logout`/`logoutAll`/`refresh-token` actually revoke -
`AuthService.logout` flips it to `false` for one `(authId, deviceId)` row,
`logoutAll` for every row belonging to that `authId`. `AuthService.refreshToken`
checks it (`AuthRepo.isDeviceActive`) before issuing a new session - a refresh token
signed before a logout still verifies fine cryptographically (it hasn't expired), so
without this check logging out wouldn't actually revoke anything; a real deployment
would want a similar check in `JwtAuthGuard` for access tokens too, not just refresh.

`synchronize: !Flavour.isProd()` (see "Flavour" above) auto-creates/updates tables from
the entities on every boot in dev/uat - fine there since there's no migration tooling
yet, but never in prod, where it's turned off unconditionally (it can silently
drop/alter columns on a schema change - real migrations should replace this once they
exist, for every environment).

## Response envelope: Packet

Every response this API sends - success or thrown error - goes out shaped as a
`Packet<T>` (`config/http/packet.ts`), matching the frontend's own `DataResponse` (see
`frontend/src/config/network/data_response.ts`) so `SecureCall` can unwrap it without
any per-route special-casing:

- **Flat, not nested under `data`.** `Packet<T>` merges `success: true` (and
  `message`, if given) directly onto `T`'s own fields - e.g. `Packet<VerifyOtpResponse>`
  is `VerifyOtpResponse` itself plus `success`/`message`, not `{ data: VerifyOtpResponse
  }`. `Packet.success(fields, message?, httpStatus = 200)` builds this; when `fields`
  isn't a plain object (a bare string/number/array a route returns directly - see
  `AppController.getHello()`) there's nothing to merge onto, so it falls back to
  `{ success: true, data: fields }` instead - that's the one case still nested.
  `Packet.failed(message, errorCode?, httpStatus = 200)` builds the failure side
  (`{ success: false, message, errorCode }`) - never nested, there's no `T` involved.
  `httpStatus` on either is a transport concern, not a body field - it's stripped
  before anything is serialized.
- **`PacketInterceptor`** (global, registered in `main.ts`) auto-wraps a controller's
  plain return value in `Packet.success(data)` for any route that doesn't need a
  custom message/status and just returns its result as-is. A route that wants to
  build its own envelope (a custom message, a non-200 success status, or to return a
  failure without throwing - see `core/user/auth/auth.controller.ts`/
  `auth.service.ts`, every route there does this) returns a
  `Packet.success(...)`/`Packet.failed(...)` result itself; `isFinalResponse()`
  recognizes the `success` field already on it and passes
  it through instead of wrapping it again.
- **`PacketExceptionFilter`** (global, registered in `main.ts`) catches everything a
  guard/pipe/service throws and formats it as `Packet.failed(...)`, preserving the real
  HTTP status (a thrown `UnauthorizedException` still sends a real 401, etc.) - the
  frontend's own token-refresh flow depends on that real status code, so this never
  flattens every error to 200.
- A route can also skip throwing entirely and just `return Packet.failed(message)`
  directly for an **expected** business-logic failure (see `AuthService.verifyOtp` -
  invalid/expired/exhausted OTP, or a blocked account) - this sends a real 200
  (`Packet.failed`'s own default), not a thrown exception's status. Appropriate here
  since "wrong OTP" isn't an infrastructure/auth failure, just an expected outcome the
  caller needs the real message for (which a thrown `UnauthorizedException` used to
  lose anyway - the frontend's `SecureCall` shows a generic per-status message for any
  non-2xx response, never the body's own, so a 401 here would have silently discarded
  "Invalid OTP" in favor of "Session expired..."). Reach for throwing instead when
  something is actually exceptional (a bad/missing token, an unimplemented route, a
  real bug) rather than a normal "this failed" result.

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

- Unit specs (`*.spec.ts`) live next to the file they test. There are none yet - when
  adding one, mock the feature's own repo/config dependencies by hand (plain objects
  of `vi.fn()`s) rather than spinning up a real `Test.createTestingModule`; that's
  what E2E specs are for. Run with `npm run test` (currently exits non-zero with "no
  test files found" until one exists).
- E2E specs live in `test/` and boot the real `AppModule` (see `test/app.e2e-spec.ts`,
  which checks the global `JwtAuthGuard` actually rejects an unauthenticated request
  to a protected route). Run with `npm run test:e2e`.
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

- **`core/user/auth/` is the only feature so far.** There's no `GET /` demo route
  anymore either (the Nest CLI's own scaffolded `core/app/` was removed) - the app is
  login/OTP/session routes only until a real second feature lands.
- **SQLite, `synchronize` (dev/uat only), no migrations.** Fine for this stage - see
  "Database"'s own caveat on when to add real migrations.
- **No 3rd-party SDK is installed** for Razorpay/mail/SMS — see the table above.
  `generate-otp` calls the SMS or mail stub (`ContactFormatter.isEmail()` picks which
  - see below), which just logs the code instead of actually sending it - read it from
  the server log (or the `auth_otp` table directly) until a real provider is wired in.
- **Login accepts a phone number or an email, not just phone.** The wire/DTO field is
  named `identifier` (`GenerateOtpDto`/`ValidateOtpDto` in both
  `core/user/auth/auth.controller.ts` and `core/admin/auth/auth.controller.ts`) -
  it used to be called `mobileNumber`, which was misleading once email logins were
  added. There's no separate identifier column in the DB for this though (see
  `AuthEntity`) - the same `phone` field/column just holds whichever was used to sign
  up, and `ContactFormatter.isEmail()`
  (`config/utils/contactFormatter.ts`) is what `AuthService.generateOtp` checks to
  route the OTP through `MailService` vs `SmsService`. `AuthRepo.createProfile` also
  copies it into `mail` when it's an email, so a new profile's own `mail`/`phone`
  fields reflect what was actually used, even though the DB itself doesn't
  distinguish the two.
