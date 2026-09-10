# Frontend architecture guide

React Native app **gerogo** (Android `applicationId`/iOS bundle id: `com.gerogo.wave`).
This file documents the structure and conventions the codebase follows — read it
before adding a new screen, component, color, or asset so new code lands in the right
place and matches what's already here.

## Directory structure

```
src/
├── config/                    shared library - reusable across any feature
│   ├── components/            UI kit, organized by concern (appbar/, buttons/, form/, ...)
│   ├── routes/                registry.ts (Routes + Route class), router.tsx, AppRoleRouter.tsx
│   ├── theme/                 AppColors.ts, AppFonts.ts, Themer.ts, applyGlobalFont.ts
│   ├── network/                api_sheet.ts (endpoint paths), secure_call.ts, data_response.ts
│   ├── storage/                AStorage.ts (AsyncStorage wrapper), Cacher.ts
│   ├── device/, permission/, services/, flavour/, utils/, constants/, types/
│   └── ...
└── core/                       actual app features, one folder per screen
    ├── auth/{login,otp,registration,blocked}/
    └── user/{home,profile}/
```

## `config/` vs `core/`

- **`config/`** is the shared component/utility library — generic, reusable, not
  specific to any one screen. Nothing in here should import from `core/`.
- **`core/`** is where actual features live, one folder per screen under
  `core/<role>/<feature>/` (`role` is `auth` or `user` today).

## Feature convention: Page / Controller / Cases / Repo

Every screen under `core/` follows the same split (see `core/user/home/` or
`core/user/profile/` as the worked examples):

- **`<Feature>Page.tsx`** — the screen. Exports the full page (with its chrome) *and*,
  where the feature is also a bottom-bar tab, a bare `<Feature>Body`/`<Feature>TabBody`
  variant with no chrome of its own (see "Bottom bar" below).
- **`<Feature>Controller.ts`** — a hook (`use<Feature>Controller()`) holding the
  screen's state and event handlers. The Page stays presentational; all state lives
  here.
- **`<Feature>Cases.ts`** — use-cases / business rules, called by the controller.
- **`<Feature>Repo.ts`** — the only layer allowed to call the network (`secure_call.ts`)
  or read mock data. Cases call Repo, never the other way, and a Page never calls Repo
  directly.

## Routing

- **`config/routes/registry.ts`** — `Routes.user.*` / `Routes.auth.*` / `Routes.common.*`
  are `Route` instances (`new Route('/user/home')`); call `.navigate()`/`.replace()`/
  `.clearAll()` on one rather than using React Navigation's API directly. A `Route` can
  exist here with no page built yet — that's normal scaffolding for a planned screen
  (see "Known gaps" below), not a bug.
- **`config/routes/router.tsx`** — the `Stack.Navigator`. Only lists `Stack.Screen`s for
  pages that actually exist; a route declared in `registry.ts` doesn't need a matching
  entry here until its page is built.
- **`config/routes/AppRoleRouter.tsx`** — the intended app root (not yet mounted by
  `App.tsx` — see "Known gaps"). Redirects a fresh, unauthenticated launch to Login.

## Bottom bar

Current tabs: **Home, Subscription, Search, Cart, Profile** (`BottomType` in
`config/components/bottombar/BottomBar.tsx`). `BottomBarView.tsx`'s `BODIES` map is a
`Record<BottomType, Component>` — TypeScript requires every tab to have an entry, so
adding/removing a tab always means updating `BottomType`, `TABS`, `BODIES`, and
`Routes.user` together (the tab's key must match a `Routes.user` key exactly).

A tab whose page doesn't exist yet gets `<ComingSoonBody label="..." />`
(`config/components/layouts/ComingSoonBody.tsx`) instead of dropping the tab — swap it
for the real `<Feature>Body` once that page is built, same as Home and Profile already
do.

## Theming

- **`AppColors.ts`** — `primary`/`primary100-900`, `secondary`/`secondary100-900`,
  `teritary`/`teritary100-900` (spelled without the second "r" — intentional, matches
  the design tokens as given), `neutral`/`neutral100-900`, `red`. This is the **entire**
  palette — no `white`/`black`/gradient tokens exist (see "Known gaps": several files
  still reference the old palette and won't compile until updated to these tokens).
- **`AppFonts.ts`** — `thin/extraLight/light/regular/medium/semiBold/bold`, all backed
  by the Jost font family (`assets/fonts/Jost/`, 7 static weights, linked natively into
  both `android/app/src/main/assets/fonts/` and `ios/frontend/Fonts/` +
  `Info.plist`'s `UIAppFonts`). `applyGlobalFont()` (called once from `App.tsx`) patches
  `Text`/`TextInput` defaults to `AppFonts.regular` — a screen only needs an explicit
  `fontFamily: AppFonts.bold`/`.semiBold` override for a non-regular weight;
  `fontWeight: '700'` alone does **not** switch to the real Bold file (each weight is
  its own font-family name, not one variable family).
- **`Themer.ts`** — gradients/shadows built from `AppColors`. **Currently broken** (see
  "Known gaps") — it still references gradient stops removed in the palette rewrite.

## Assets

- **`assets/icons/`** — SVGs (mostly placeholders — outlined circle for `ic_*`, dashed
  frame for `ill_*`/`logo_*`) plus `ill_not_found.png`. Every filename referenced by
  `config/components/images/svg_icons.ts` exists; swap a placeholder's *content* for
  real artwork without renaming the file or touching `svg_icons.ts`.
- **`assets/anim/`** — Lottie JSON, currently empty/inert placeholder compositions.
- **`assets/store/`** — misc images (e.g. a partner/store logo).
- **`assets/fonts/Jost/`** — 7 static `.ttf` weights only (no variable fonts, no
  italics, no Black/ExtraBold) — kept deliberately minimal; see `react-native.config.js`
  for the declared source folder.

## App identity

- Package id / bundle id: `com.gerogo.wave` — Android in `android/app/build.gradle`
  (`namespace`/`applicationId`) and the Kotlin package
  (`android/app/src/main/java/com/gerogo/wave/`); iOS in
  `ios/frontend.xcodeproj/project.pbxproj`'s `PRODUCT_BUNDLE_IDENTIFIER`.
- App name: `gerogo` — `app.json`, Android's `getMainComponentName()`
  (`MainActivity.kt`) + `strings.xml`'s `app_name`, iOS's `AppDelegate.swift`'s
  `withModuleName` + `Info.plist`'s `CFBundleDisplayName`. **Android's
  `getMainComponentName()` and iOS's `withModuleName` must always match `app.json`'s
  `name` exactly** — a mismatch means the app fails to find its registered JS
  component at launch.
- The iOS project/target/scheme folder and file names (`ios/frontend.xcodeproj`,
  `ios/frontend/`, the Podfile's `target 'frontend'`) are still `frontend` — renaming
  those means rewriting cross-references inside the Xcode project format itself, so
  they were deliberately left alone; only the values above were changed.

## Running & debugging

Three platforms, three different mechanisms:

- **Android** — `npm run android` (Metro + native build), or VS Code's **Run Android**
  launch config (`.vscode/launch.json`). The latter needs the **React Native Tools**
  extension (`msjsdiag.vscode-react-native`), which registers the `reactnative` debug
  type.
- **iOS** — same idea: `npm run ios`, or VS Code's **Run iOS** config (same extension).
  `Attach to packager` (also in `launch.json`) attaches to an already-running Metro
  instead of building/launching a fresh app instance.
- **Web** — this is a separate build entirely, via `react-native-web` + webpack, not
  Metro:
  - `webpack.config.js` aliases `react-native` → `react-native-web` and resolves
    `.web.tsx`/`.web.ts`/`.web.js` first (same priority Metro gives that suffix for
    android/ios) — this is what actually makes `AppConfig.web.ts` and
    `blurActiveElement.web.ts` take effect; until this setup existed they were dead
    code no bundler ever picked up.
  - `index.web.js` is the web-only entry point (`index.js` only registers the
    component; there's no native host to call `runApplication()` for it on web, so
    this file calls it explicitly against `web/index.html`'s `#root` div).
  - `npm run web` starts the dev server (`webpack serve`, port `4040`); `npm run
    web:build` produces a production bundle in `web-build/`.
  - VS Code's **Run Web** config uses the built-in JavaScript debugger (`chrome`
    type) against `http://localhost:4040`, with a `preLaunchTask` (see
    `.vscode/tasks.json`) that starts the dev server automatically — no separate
    terminal needed first.
  - A handful of `node_modules` packages ship un-transpiled Flow/JSX source
    (`react-native` itself, `react-native-web`, anything under the `@react-native`
    scope) — `webpack.config.js`'s `babelLoaderConfiguration` explicitly includes
    them rather than the usual blanket `node_modules` exclude, or the bundle fails
    to parse.

## Conventions

- **No path aliases** — every import is relative (`babel.config.js` has no module
  resolver). Match the existing `../../../` depth rather than introducing an alias.
- **Comment style** — long comments explaining *why*, not *what*, are the norm
  throughout this codebase (see almost any file in `core/` or `config/components/`).
  Match that density on non-trivial logic; don't strip these comments as "verbose."

## Known gaps

- **`App.tsx`/`index.js` are still the RN CLI default template** — `AppRoleRouter`
  (the real app root) is never mounted. Wiring it in is the natural next step once
  there's a reason to actually run the app end-to-end.
- **`AppColors`'s old tokens are gone but ~40 files still reference them** —
  `white`/`black`/`text`/`copper`, the blue/green/yellow/purple accents, and every
  gradient stop (`primaryG1/G2`, `secondaryG1`, `teritaryG1/G2`, `pealG1/G2`) no longer
  exist. This was a deliberate "replace, don't remap" request — `tsc --noEmit` will
  show every affected call site (mostly `Themer.ts` and anything setting a white
  background/text color).
- **Several npm packages are referenced in code but never installed**: `react-native-svg`
  (+ `react-native-svg-transformer`, and `metro.config.js` has no SVG transformer
  configured either — so `.svg` imports won't actually work at runtime yet despite the
  files existing), `lottie-react-native`, `@react-native-voice/voice`,
  `react-native-device-info`, `@react-native-community/geolocation`,
  `react-native-biometrics`, `@notifee/react-native`, `react-native-fs`, `crypto-js`.
- **~25 components in `config/components/`** (e.g. `ServiceTile.tsx`,
  `NotificationTiles.tsx`, `DeleteAccountSheet.tsx`, `SearchableDropdown.tsx`,
  `MultiSelector.tsx`) have no current importer — each corresponds to an
  already-registered-but-unbuilt route in `registry.ts` (Services, Notifications,
  Delete Account, the `*Search` pages, ...). Kept intentionally as scaffolding, same
  reasoning as the bottom-bar placeholders.
- **Home and Profile reference a few files that don't exist yet**:
  `ProfileProgressModel`/`ProfileProgressCard`, `ProfileFeaturesModel`/`Card`,
  `ProfileMenuSheet`, `NewsModel`/`NewsCases`/`NewsTiles`, `HomeMockData`,
  `ProfileMockData`. Unlike the scaffolding above, these back screens that **do**
  exist and are expected to compile — building these out (not removing the
  references) is the fix.
- **The web build was only verified at the `webpack` compile level** (a clean build +
  the dev server serving 200s for both `index.html` and the bundle) — not exercised in
  an actual browser. `App.tsx`'s current content (`@react-native/new-app-screen`) is
  untested at runtime under `react-native-web`; once `App.tsx` moves off the default
  template (see the first gap above) this stops being a concern either way. The
  `.svg`/Lottie gaps above apply to web too - nothing installs an SVG/Lottie
  implementation for `react-native-web` either.
