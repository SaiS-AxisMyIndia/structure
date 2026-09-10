import { version, buildNumber } from '../flavour';

// `version`/`buildNumber` come straight from the build - CFBundleShortVersionString
// /CFBundleVersion on iOS, BuildConfig.VERSION_NAME/VERSION_CODE on Android (see
// ios/a_app/AppConfig.swift, android AppConfigModule.kt). AGP/Xcode fill these in for
// every flavour automatically, so there's nothing per-flavour to keep in sync here.
export function getAppVersion(): string {
  return `${version} (${buildNumber})`;
}
