import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export type ScreenLifecycleCallbacks = {
  // Fires once, right when the screen is created - the closest RN
  // equivalent of Android's Activity.onCreate.
  onCreate?: () => void;
  // Fires whenever the screen becomes the one the person can actually see
  // and interact with - both when it gains navigation focus (this screen
  // was just pushed, or another screen on top of it was popped) *and*
  // when the whole app returns to the foreground while this screen
  // already had focus (e.g. coming back from the home button, an
  // incoming call, or the notification shade).
  onResume?: () => void;
  // The mirror of onResume - fires when this screen loses focus (another
  // screen pushed on top, or the app switches to a different route) *or*
  // the whole app leaves the foreground while this screen still had
  // focus. Exactly one onPause follows every onResume, and vice versa.
  onPause?: () => void;
  // Fires once, when the screen is removed for good (popped off the
  // stack) - the closest RN equivalent of Android's Activity.onDestroy.
  onDestroy?: () => void;
};

// The reusable core: given a caller-supplied "is *this* screen/tab the one
// currently shown and interactive right now, ignoring whether the app
// itself is foregrounded" boolean, combines it with AppState to fire
// onResume/onPause, and fires onCreate/onDestroy once on mount/unmount.
// Exported (not just used internally by useScreenLifecycle below) so
// TabScreenView.tsx can supply its own notion of "active" instead of
// useIsFocused() - see that file's own use of this for why a tab body
// needs a different signal than a standalone ScreenView page does.
//
// onCreate/onDestroy fire exactly once each, bookending the screen
// regardless of how many onResume/onPause pairs happen while it's alive -
// same relationship Android's onCreate/onDestroy have to its onResume/
// onPause. There is still no true "app is being killed" signal on either
// platform (iOS/Android don't reliably deliver one to JS at all) -
// onDestroy here only ever means "this screen was popped/unmounted while
// the app stayed running", not "the app process died".
export function useLifecycleFromActive(isActive: boolean, { onCreate, onResume, onPause, onDestroy }: ScreenLifecycleCallbacks) {
  // Refs, not the props directly, so a caller passing a fresh inline
  // function every render doesn't force this hook's effects to
  // re-subscribe (and misfire) - only isActive/AppState actually changing
  // should ever trigger onResume/onPause.
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const callbacksRef = useRef({ onResume, onPause });
  callbacksRef.current = { onResume, onPause };
  const resumedRef = useRef(false);

  const setResumed = (resumed: boolean) => {
    if (resumed === resumedRef.current) {return;}
    resumedRef.current = resumed;
    if (resumed) {
      callbacksRef.current.onResume?.();
    } else {
      callbacksRef.current.onPause?.();
    }
  };

  useEffect(() => {
    setResumed(isActive && AppState.currentState === 'active');
  }, [isActive]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      setResumed(isActiveRef.current && next === 'active');
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    onCreate?.();
    return () => onDestroy?.();
    // onCreate/onDestroy are one-shot by design - depending on them here
    // would re-fire on every render instead of just once on mount/unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// React Native has no true Activity lifecycle - there's no OS-level
// signal for "this specific screen is now the visible/interactive one"
// the way Android's Activity gets onResume/onPause calls. This
// approximates it from the two signals that together get closest:
// useIsFocused() (has *this screen's own route* lost focus - another
// screen pushed on top) and AppState (has the *whole app* left the
// foreground - Home button, an incoming call, the notification shade).
// Same two signals AVideoPlayerController.ts/AAudioPlayerController.ts
// already combine to pause playback - this generalizes that into
// resume/pause callbacks any standalone page (via ScreenView) can hook
// into. Tab bodies use useLifecycleFromActive directly instead - see
// TabScreenView.tsx.
export function useScreenLifecycle(callbacks: ScreenLifecycleCallbacks) {
  const isFocused = useIsFocused();
  useLifecycleFromActive(isFocused, callbacks);
}
