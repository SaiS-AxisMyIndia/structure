import { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

// Kept short on purpose - "quick fill" per guide/todo.md's own wording, not
// a leisurely fade.
const BACKDROP_FADE_DURATION = 150;
const SHEET_SLIDE_DURATION = 250;

// Only needs to be "below the visible area", not track resizes/rotation -
// read once at module load, same as every other one-shot layout constant
// in this app (AppConstants.maxWidth and friends).
const OFFSCREEN_Y = Dimensions.get('window').height;

// Every bottom sheet (ChooseModeSheet/LogoutSheet/DeleteAccountSheet/
// HospitalDetailSheet/ProfileMenuSheet/ApplyJobSheet) uses this instead of
// the Modal's own `animationType="slide"` - that animates the *entire*
// native modal content (backdrop included) as one sliding unit, so the
// backdrop's semi-transparent color visibly slid up into place together
// with the sheet card instead of just quickly fading in where it already
// is. Each sheet now renders with `animationType="none"` and drives both
// animations itself: `backdropOpacity` (0 -> 1, fast) on the backdrop's
// `opacity`, `sheetTranslateY` (offscreen -> 0, over SHEET_SLIDE_DURATION)
// on a `transform: [{ translateY }]` wrapping just the sheet card - so the
// backdrop fades in place while only the card itself slides.
export function useSheetTransition(visible: boolean) {
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(OFFSCREEN_Y)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: BACKDROP_FADE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: SHEET_SLIDE_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      backdropOpacity.setValue(0);
      sheetTranslateY.setValue(OFFSCREEN_Y);
    }
  }, [visible, backdropOpacity, sheetTranslateY]);

  return { backdropOpacity, sheetTranslateY };
}
