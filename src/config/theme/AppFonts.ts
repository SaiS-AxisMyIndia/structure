// Font family names must match each file's internal PostScript name exactly
// (verified against the .ttf `name` table) - Android resolves by filename,
// iOS by PostScript name, and on both platforms a mismatch here silently
// falls back to the system font instead of erroring.
export const AppFonts = {
  thin: 'IBMPlexSansDevanagari-Thin',
  extraLight: 'IBMPlexSansDevanagari-ExtraLight',
  light: 'IBMPlexSansDevanagari-Light',
  regular: 'IBMPlexSansDevanagari-Regular',
  medium: 'IBMPlexSansDevanagari-Medium',
  semiBold: 'IBMPlexSansDevanagari-SemiBold',
  bold: 'IBMPlexSansDevanagari-Bold',
} as const;
