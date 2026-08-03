import {
  CommonActions,
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';
import { Linking } from 'react-native';

export const navigationRef = createNavigationContainerRef();

const EXTERNAL_TAG = /^<External>(.+)$/i;
const INTERNAL_TAG = /^<Internal>(.+)$/i;

type ScreenQuery = Record<string, unknown>;
type ScreenBody = Record<string, unknown>;

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
    navigationRef.dispatch(CommonActions.navigate(this.name, { query, body }));
  }

  replace(query: ScreenQuery = {}, body: ScreenBody = {}) {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(StackActions.replace(this.name, { query, body }));
  }

  clearAll() {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [{ name: this.name }] }));
  }

  internalWebview(query: ScreenQuery = {}, body: ScreenBody = {}) {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(CommonActions.navigate(Routes.common.webview.name, { query, body }));
  }

  externalWeb(query: ScreenQuery = {}, body: ScreenBody = {}) {
    if (!navigationRef.isReady()) return;
    navigationRef.dispatch(CommonActions.navigate(this.name, { query, body }));
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
