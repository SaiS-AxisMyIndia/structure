import { useRef, useState } from 'react';
import { Animated, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

const HIDE_SHOW_DURATION = 220;
// How far the list has to move in one direction, net, before the header
// flips hidden/shown - not every scroll event, so a small bounce/jiggle
// (momentum overshoot, a light nudge) doesn't twitch it. Callers can pass
// their own value to useScrollController(offset) instead - this is just
// the default.
export const DEFAULT_HIDE_ON_SCROLL_OFFSET = 20;

export type ScrollController = {
  translateY: Animated.Value;
  headerHeight: number;
  atTop: boolean;
  // True once the header has actually been sent off-screen (past the
  // accumulated `offset` threshold below), not merely "scrolled away from
  // y=0" the way `atTop` is - flips the moment the hide animation starts,
  // in sync with `translateY`'s own target, not a separate signal that
  // could drift from what's actually on screen.
  hidden: boolean;
  onHeaderLayout: (event: LayoutChangeEvent) => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};
export function useScrollController(offset: number = DEFAULT_HIDE_ON_SCROLL_OFFSET): ScrollController {
  const translateY = useRef(new Animated.Value(0)).current;
  const [headerHeight, setHeaderHeight] = useState(0);
  const [atTop, setAtTop] = useState(true);
  const [hidden, setHiddenState] = useState(false);
  const headerHeightRef = useRef(0);
  const hiddenRef = useRef(false);
  const lastYRef = useRef(0);
  const accumulatedRef = useRef(0);

  const onHeaderLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    if (height === 0 || height === headerHeightRef.current) {return;}
    headerHeightRef.current = height;
    setHeaderHeight(height);
  };

  const setHidden = (nextHidden: boolean) => {
    if (hiddenRef.current === nextHidden) {return;}
    hiddenRef.current = nextHidden;
    setHiddenState(nextHidden);
    Animated.timing(translateY, {
      toValue: nextHidden ? -headerHeightRef.current : 0,
      duration: HIDE_SHOW_DURATION,
      useNativeDriver: true,
    }).start();
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const delta = y - lastYRef.current;
    lastYRef.current = y;
    setAtTop(y <= 0);

    // Back at (or bouncing past, on iOS) the top - always show, and reset
    // the accumulator so the next scroll starts counting fresh.
    if (y <= 0) {
      accumulatedRef.current = 0;
      setHidden(false);
      return;
    }

    // A direction reversal restarts the count instead of fighting the
    // threshold against whatever was accumulated the other way.
    if ((delta > 0 && accumulatedRef.current < 0) || (delta < 0 && accumulatedRef.current > 0)) {
      accumulatedRef.current = 0;
    }
    accumulatedRef.current += delta;

    if (accumulatedRef.current > offset) {
      setHidden(true);
      accumulatedRef.current = 0;
    } else if (accumulatedRef.current < -offset) {
      setHidden(false);
      accumulatedRef.current = 0;
    }
  };

  return { translateY, headerHeight, atTop, hidden, onHeaderLayout, onScroll };
}
