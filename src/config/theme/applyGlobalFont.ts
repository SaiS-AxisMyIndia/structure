import { Text, TextInput } from 'react-native';
import { AppFonts } from './AppFonts';

// RN has no built-in "app-wide default font" hook, so this patches
// Text/TextInput's defaultProps once at startup (see App.tsx) - every
// <Text>/<TextInput> in the app picks up the custom font without each
// screen having to set `fontFamily` itself. Per-style `fontFamily`
// overrides (e.g. AppFonts.bold/semiBold for a heading) still win, since
// they're applied after this default in the style array.
export function applyGlobalFont() {
  const AnyText = Text as unknown as { defaultProps?: { style?: unknown } };
  AnyText.defaultProps = AnyText.defaultProps || {};
  AnyText.defaultProps.style = [{ fontFamily: AppFonts.regular }, AnyText.defaultProps.style];

  const AnyTextInput = TextInput as unknown as { defaultProps?: { style?: unknown } };
  AnyTextInput.defaultProps = AnyTextInput.defaultProps || {};
  AnyTextInput.defaultProps.style = [{ fontFamily: AppFonts.regular }, AnyTextInput.defaultProps.style];
}
