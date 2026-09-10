import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { FeaturesConfig } from '../flavour/FeaturesConfig';

function usePersistedBoolean(key: string, defaultValue: boolean) {
  const [value, setValueState] = useState(defaultValue);

  useEffect(() => {
    AsyncStorage.getItem(key).then(stored => {
      if (stored !== null) {setValueState(stored === 'true');}
    });
  }, [key]);

  const setValue = (next: boolean) => {
    setValueState(next);
    AsyncStorage.setItem(key, String(next));
  };

  return [value, setValue] as const;
}

// One JSON blob under WALKTHROUGHS_KEY, e.g. { "hospitals": true, "needs":
// true } - true means "hasn't been dismissed yet, still show it", so a
// page not present in the map (a walkthrough shipped after a user's last
// dismiss-everything sweep, or just never seen) defaults to shown. Each
// page's flag is independent - skipping/finishing one only ever writes
// that page's own key, unlike a single global flag which would suppress
// every page's walkthrough at once.
type WalkthroughFlags = Record<string, boolean>;
const WALKTHROUGHS_KEY = 'walkthroughs';

function usePersistedWalkthroughFlag(page: string, forceShow = false) {
  const [value, setValueState] = useState(true);

  useEffect(() => {
    if (forceShow) {
      return;
    }
    AsyncStorage.getItem(WALKTHROUGHS_KEY).then(stored => {
      const flags = stored ? (JSON.parse(stored) as WalkthroughFlags) : {};
      if (page in flags) {setValueState(flags[page]);}
    });
  }, [page, forceShow]);

  const setValue = async (next: boolean) => {
    setValueState(next);
    const stored = await AsyncStorage.getItem(WALKTHROUGHS_KEY);
    const flags: WalkthroughFlags = stored ? JSON.parse(stored) : {};
    flags[page] = next;
    await AsyncStorage.setItem(WALKTHROUGHS_KEY, JSON.stringify(flags));
  };

  return [value, setValue] as const;
}

// One-off load on mount, same shape as usePersistedBoolean/
// usePersistedWalkthroughFlag above - null until it resolves (logged out,
// or just not loaded yet), then the parsed StoredUser. No live cross-
// component sync (e.g. two mounted instances after AStorage.saveUser())
// is needed yet - every current call site (MainBar's own greeting) reads
// this once per mount, not across a save happening elsewhere while it's
// still on screen.
function usePersistedUser() {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    AStorage.getUser().then(setUser);
  }, []);

  return user;
}

export type StoredUser = {
  mobile: string;
  name?: string;
  gender?: string;
};

const AUTH_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const LANGUAGE_KEY = 'language';
const USER_KEY = 'user';
const DEFAULT_LANGUAGE = 'en';

export const AStorage = {
  useOfflineMode: () => {
    const [offlineMode, setOfflineMode] = usePersistedBoolean('offlineMode', false);
    return { offlineMode, setOfflineMode };
  },

  // `page` is a stable key per walkthrough (e.g. "hospitals") - each
  // page's flag lives independently under one shared JSON blob (see
  // usePersistedWalkthroughFlag), so dismissing one page's walkthrough
  // doesn't touch any other page's. FeaturesConfig.showWalkThroughs is a
  // hard master switch - false suppresses every walkthrough outright,
  // regardless of walkThroughTesting or any per-page persisted state.
  useShowWalkthrough: (page: string) => {
    const [showWalkthrough, setShowWalkthrough] = usePersistedWalkthroughFlag(
      page,
      FeaturesConfig.walkThroughTesting,
    );
    return {
      showWalkthrough: FeaturesConfig.showWalkThroughs && showWalkthrough,
      setShowWalkthrough,
    };
  },

  resetWalkthroughs: (): Promise<void> => AsyncStorage.removeItem(WALKTHROUGHS_KEY),

  getAuthToken: (): Promise<string | null> => AsyncStorage.getItem(AUTH_TOKEN_KEY),
  setAuthToken: (token: string | null): Promise<void> =>
    token === null ? AsyncStorage.removeItem(AUTH_TOKEN_KEY) : AsyncStorage.setItem(AUTH_TOKEN_KEY, token),

  getRefreshToken: (): Promise<string | null> => AsyncStorage.getItem(REFRESH_TOKEN_KEY),
  setRefreshToken: (token: string | null): Promise<void> =>
    token === null ? AsyncStorage.removeItem(REFRESH_TOKEN_KEY) : AsyncStorage.setItem(REFRESH_TOKEN_KEY, token),

  getLanguage: async (): Promise<string> => (await AsyncStorage.getItem(LANGUAGE_KEY)) ?? DEFAULT_LANGUAGE,
  setLanguage: (code: string): Promise<void> => AsyncStorage.setItem(LANGUAGE_KEY, code),

  saveUser: async (user: Partial<StoredUser>): Promise<void> => {
    const existing = await AStorage.getUser();
    await AsyncStorage.setItem(USER_KEY, JSON.stringify({ ...existing, ...user }));
  },
  getUser: async (): Promise<StoredUser | null> => {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as StoredUser) : null;
  },
  clearUser: (): Promise<void> => AsyncStorage.removeItem(USER_KEY),

  // Reactive read of the stored user for a component - e.g. MainBar's own
  // greeting, which needs whatever LoginController.onVerifyPress last saved
  // rather than a one-off Promise a render can't wait on.
  useStoredUser: (): StoredUser | null => usePersistedUser(),

  // Convenience readers for one field off the stored user instead of
  // every caller doing `(await AStorage.getUser())?.name` etc. itself.
  getName: async (): Promise<string | undefined> => (await AStorage.getUser())?.name,
  getPhone: async (): Promise<string | undefined> => (await AStorage.getUser())?.mobile,
  getGender: async (): Promise<string | undefined> => (await AStorage.getUser())?.gender,

  // authToken alone, not authToken && refreshToken - the real validate-otp
  // response has no refresh token yet (see LoginController's own
  // onVerifyPress), so requiring one here would make this always false
  // for a real login.
  // Used by registry.ts's own Authenticated route guard.
  isLogin: async (): Promise<boolean> => Boolean(await AStorage.getAuthToken()),

  logout: (): Promise<void> =>
    Promise.all([
      AStorage.clearUser(),
      AStorage.setAuthToken(null),
      AStorage.setRefreshToken(null),
      AStorage.setLanguage(DEFAULT_LANGUAGE),
      AStorage.resetWalkthroughs(),
    ]).then(() => undefined),
};
