import { useEffect, useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';

// State + imperative actions in one object, same shape as
// players/AVideoPlayerController.ts/AAudioPlayerController.ts - built by the
// hook below and threaded down to SearchView as a single `controller` prop,
// so callers can read `.value` or call `.clear()`/`.focus()` without
// SearchView itself owning any page-level search-trigger logic.
export type SearchViewController = {
  value: string;
  setValue: (value: string) => void;
  clear: () => void;
  focus: () => void;
  inputRef: React.RefObject<TextInput | null>;
};

export function useSearchViewController(initialValue: string = ''): SearchViewController {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);

  return {
    value,
    setValue,
    clear: () => setValue(''),
    focus: () => inputRef.current?.focus(),
    inputRef,
  };
}

const SEARCH_DEBOUNCE_MS = 400;

export function useDebouncedValue<T>(value: T, delayMs: number = SEARCH_DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}

export function useAutoFocusSearch(controller: SearchViewController, enabled: boolean) {
  const navigation = useNavigation();
  const firedRef = useRef(false);
  // controller is a fresh object every render (see useSearchViewController
  // above) - read the latest one through a ref instead of closing over the
  // `controller` param directly, so the effect below doesn't need it (or a
  // fresh subscription every render) in its own dependency array.
  const controllerRef = useRef(controller);
  controllerRef.current = controller;

  useEffect(() => {
    if (!enabled) {return;}

    const doFocus = () => {
      if (firedRef.current) {return;}
      firedRef.current = true;
      controllerRef.current.focus();
    };

    const unsubscribe = navigation.addListener('transitionEnd' as never, (event: { data?: { closing?: boolean } }) => {
      if (!event?.data?.closing) {doFocus();}
    });
    const timeout = setTimeout(doFocus, 400);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [enabled, navigation]);
}
