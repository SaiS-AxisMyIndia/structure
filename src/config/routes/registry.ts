import {
  CommonActions,
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';
import { Linking } from 'react-native';
import { getAppBaseUrl } from '../flavour/flavour';

export const navigationRef = createNavigationContainerRef();

const EXTERNAL_TAG = /^<External>(.+)$/i;
const INTERNAL_TAG = /^<Internal>(.+)$/i;

type ScreenQuery = Record<string, unknown>;
type ScreenBody = Record<string, unknown>;

// `query`'s fields are spread as top-level route params (so a web URL reads
// as the plain `?tag=policy` you'd expect) rather than nested under a
// `query` key, which React Navigation's default web linking would otherwise
// serialize as `?query=[object Object]`. `body` stays nested under its own
// key since it's a payload object, not meant to be a flat query string.
// Either is omitted entirely when empty, so nothing gets attached to the
// URL when nothing was actually passed.
function buildParams(query: ScreenQuery, body: ScreenBody): Record<string, unknown> | undefined {
  const hasQuery = Object.keys(query).length > 0;
  const hasBody = Object.keys(body).length > 0;
  if (!hasQuery && !hasBody) return undefined;
  return { ...query, ...(hasBody && { body }) };
}

class Route<Name extends string = string> {
  private static readonly all: Record<string, Route> = {};

  constructor(readonly name: Name) {
    Route.all[name] = this;
  }

  static find(name: string): Route | undefined {
    return Route.all[name];
  }

  navigate(query: ScreenQuery = {}, body: ScreenBody = {}) {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(CommonActions.navigate(this.name, buildParams(query, body)));
  }

  replace(query: ScreenQuery = {}, body: ScreenBody = {}) {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(StackActions.replace(this.name, buildParams(query, body)));
  }

  clearAll() {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [{ name: this.name }] }));
  }

  // The app's own public URL for this screen (e.g. for sharing), as opposed
  // to navigate()/replace() which drive in-app navigation. Query fields are
  // flattened the same way buildParams does, so ids/tags read as plain
  // `?id=123` rather than a nested/encoded object.
  shareUrl(query: ScreenQuery = {}): string {
    const entries = Object.entries(query);
    const qs = entries.length > 0
      ? `?${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&')}`
      : '';
    return `${getAppBaseUrl()}${this.name}${qs}`;
  }

  internalWebview(query: ScreenQuery = {}, body: ScreenBody = {}) {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(CommonActions.navigate(Routes.common.webview.name, buildParams(query, body)));
  }

  externalWeb(query: ScreenQuery = {}, body: ScreenBody = {}) {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(CommonActions.navigate(this.name, buildParams(query, body)));
  }
}

export const Routes = {
  user: {
    home: new Route('/user/home'),
    explore : new Route('/user/explore'),
    jobs: new Route('/user/jobs'),
    schemes: new Route('/user/schemes'),
    services: new Route('/user/services'),
    news: new Route('/user/news'),
    newsDetails: new Route('/user/news/details'),
    notification: new Route('/user/notification'),
    profile: new Route('/user/profile'),
  },
  surveyor: {
    home: new Route('/surveyor/home'),
    surveyor: new Route('/surveyor/assignments'),
    needs: new Route('/surveyor/needs'),
    settings: new Route('/surveyor/settings'),
  },
  common: {
    webview: new Route('/wv'),
  },

  back() {
    if (!navigationRef.isReady() || !navigationRef.canGoBack()) return;
    navigationRef.dispatch(CommonActions.goBack());
  },

  deepLink(route?: string | null) {
    if (!route) return;

    const external = EXTERNAL_TAG.exec(route);
    if (external) {
      Linking.openURL(external[1]).catch(() => {});
      return;
    }

    const internal = INTERNAL_TAG.exec(route);
    if (internal) {
      Routes.common.webview.navigate({ url: internal[1] });
      return;
    }

    Route.find(route)?.navigate();
  },
};
