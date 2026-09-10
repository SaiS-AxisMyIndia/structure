import { AppConfigShape } from './AppConfig';

// AppConfig.ts reads this from a native module (see ios/a_app/AppConfig.swift
// / android AppConfigModule.kt) backed by each flavour's build-time Info.plist
// / BuildConfig values. There's no native module on web, so webpack's
// .web.ts resolution picks this file instead - same convention already used
// by @react-native-masked-view's own MaskedView.web.js. Dev-only stand-in
// until a real per-flavour web config lands.
const AppConfig: AppConfigShape = {
  brand: 'IN',
  environment: 'dev',
  // Local backend for `npm run web` (webpack's own devServer runs on 4040 -
  // see webpack.config.js).
  apiBaseUrl: 'http://localhost:5050',
  appDisplayName: 'a-app',
  version: '0.0.0',
  buildNumber: '0',
};

export default AppConfig;
