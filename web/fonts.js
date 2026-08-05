// Native links these fonts via react-native.config.js + the iOS/Android
// build (see Info.plist's UIAppFonts / android/app/src/main/assets/fonts).
// The web build has no such step, so the same files are declared here as
// @font-face rules - imported as webpack asset/resource URLs so dev and
// production builds both resolve correctly - and injected once at startup.
import { AppFonts } from '../src/config/theme/AppFonts';

import thin from '../assets/fonts/devanagari/IBMPlexSansDevanagari-Thin.ttf';
import extraLight from '../assets/fonts/devanagari/IBMPlexSansDevanagari-ExtraLight.ttf';
import light from '../assets/fonts/devanagari/IBMPlexSansDevanagari-Light.ttf';
import regular from '../assets/fonts/devanagari/IBMPlexSansDevanagari-Regular.ttf';
import medium from '../assets/fonts/devanagari/IBMPlexSansDevanagari-Medium.ttf';
import semiBold from '../assets/fonts/devanagari/IBMPlexSansDevanagari-SemiBold.ttf';
import bold from '../assets/fonts/devanagari/IBMPlexSansDevanagari-Bold.ttf';

const FACES = [
  [AppFonts.thin, thin],
  [AppFonts.extraLight, extraLight],
  [AppFonts.light, light],
  [AppFonts.regular, regular],
  [AppFonts.medium, medium],
  [AppFonts.semiBold, semiBold],
  [AppFonts.bold, bold],
];

export function injectWebFonts() {
  const style = document.createElement('style');
  style.textContent = FACES.map(
    ([family, url]) =>
      `@font-face { font-family: '${family}'; src: url('${url}') format('truetype'); font-display: swap; }`,
  ).join('\n');
  document.head.appendChild(style);
}
