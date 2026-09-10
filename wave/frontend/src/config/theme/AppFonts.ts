// Font family names must match each file's internal PostScript name exactly
// (verified against the .ttf `name` table) - Android resolves by filename,
// iOS by PostScript name, and on both platforms a mismatch here silently
// falls back to the system font instead of erroring. Source files live in
// assets/fonts/Jost (only the 7 static weights actually used by this scale -
// no italics, no Black/ExtraBold - see the trimmed-down font folder), linked
// into android/app/src/main/assets/fonts and ios/frontend/Fonts +
// Info.plist's UIAppFonts.
export const AppFonts = {
  thin: 'Jost-Thin',
  extraLight: 'Jost-ExtraLight',
  light: 'Jost-Light',
  regular: 'Jost-Regular',
  medium: 'Jost-Medium',
  semiBold: 'Jost-SemiBold',
  bold: 'Jost-Bold',
} as const;
