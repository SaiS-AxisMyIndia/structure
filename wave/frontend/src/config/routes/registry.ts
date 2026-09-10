import {
  CommonActions,
  createNavigationContainerRef,
  StackActions,
} from '@react-navigation/native';
import { Linking } from 'react-native';
import Toast from 'react-native-simple-toast';
import { Flavour } from '../flavour/flavour';
import { AStorage } from '../storage/AStorage';
import { blurActiveElement } from '../utils/blurActiveElement';

export const navigationRef = createNavigationContainerRef();

const pendingNavigations: Array<() => void> = [];

export function flushPendingNavigations() {
  while (pendingNavigations.length > 0) {
    pendingNavigations.shift()?.();
  }
}

function dispatchWhenReady(action: () => void) {
  if (navigationRef.isReady()) {
    action();
  } else {
    pendingNavigations.push(action);
  }
}

const EXTERNAL_TAG = /^<External>(.+)$/i;
const INTERNAL_TAG = /^<Internal>(.+)$/i;

type ScreenQuery = Record<string, unknown>;
type ScreenBody = Record<string, unknown>;

function parseQueryString(qs: string): ScreenQuery {
  const query: ScreenQuery = {};
  for (const pair of qs.split('&')) {
    if (!pair) {continue;}
    const [key, value = ''] = pair.split('=');
    query[decodeURIComponent(key)] = decodeURIComponent(value);
  }
  return query;
}

function buildParams(query: ScreenQuery, body: ScreenBody): Record<string, unknown> | undefined {
  const hasQuery = Object.keys(query).length > 0;
  const hasBody = Object.keys(body).length > 0;
  if (!hasQuery && !hasBody) {return undefined;}
  return { ...query, ...(hasBody && { body }) };
}

export type MiddlewareContext = { route: Route };
export type Middleware = (ctx: MiddlewareContext) => boolean | Promise<boolean>;

export const AuthWare: Middleware = async () => {
  if (await AStorage.isLogin()) {return true;}
  Routes.auth.login.clearAll();
  return false;
};

const DEFAULT_MIDDLEWARE: Middleware[] = [AuthWare];

async function guardedDispatch(route: Route, dispatch: () => void) {
  for (const middleware of route.middleware) {
    if (!(await middleware({ route }))) {return;}
  }
  dispatch();
}

export class Route<Name extends string = string> {
  private static readonly all: Record<string, Route> = {};
  readonly middleware: Middleware[];

  constructor(readonly name: Name, options: { middleware?: Middleware[] } = {}) {
    this.middleware = options.middleware ?? DEFAULT_MIDDLEWARE;
    Route.all[name] = this;
  }

  static find(name: string): Route | undefined {
    return Route.all[name];
  }

  navigate(query: ScreenQuery = {}, body: ScreenBody = {}) {
    blurActiveElement();
    guardedDispatch(this, () =>
      dispatchWhenReady(() => navigationRef.dispatch(CommonActions.navigate(this.name, buildParams(query, body)))),
    );
  }

  update(query: ScreenQuery = {}, body: ScreenBody = {}) {
    dispatchWhenReady(() =>
      navigationRef.dispatch(CommonActions.setParams(buildParams(query, body) ?? {})),
    );
  }

  replace(query: ScreenQuery = {}, body: ScreenBody = {}) {
    blurActiveElement();
    guardedDispatch(this, () =>
      dispatchWhenReady(() => navigationRef.dispatch(StackActions.replace(this.name, buildParams(query, body)))),
    );
  }

  clearAll() {
    blurActiveElement();
    guardedDispatch(this, () =>
      dispatchWhenReady(() =>
        navigationRef.dispatch(CommonActions.reset({ index: 0, routes: [{ name: this.name }] })),
      ),
    );
  }

  shareUrl(query: ScreenQuery = {}): string {
    const entries = Object.entries(query);
    const qs = entries.length > 0
      ? `?${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`).join('&')}`
      : '';
    return `${Flavour.getAppBaseUrl()}${this.name}${qs}`;
  }

  internalWebview(query: ScreenQuery = {}, body: ScreenBody = {}) {
    blurActiveElement();
    guardedDispatch(Routes.common.webview, () =>
      dispatchWhenReady(() =>
        navigationRef.dispatch(CommonActions.navigate(Routes.common.webview.name, buildParams(query, body))),
      ),
    );
  }

  externalWeb(query: ScreenQuery = {}, body: ScreenBody = {}) {
    blurActiveElement();
    guardedDispatch(this, () =>
      dispatchWhenReady(() => navigationRef.dispatch(CommonActions.navigate(this.name, buildParams(query, body)))),
    );
  }
}

export const Routes = {
  user: {
    home: new Route('/user/home'),
    subscription: new Route('/user/subscription'),
    search: new Route('/user/search'),
    cart: new Route('/user/cart'),
    explore : new Route('/user/explore'),
    jobs: new Route('/user/jobs'),
    jobDetails: new Route('/user/jobs/details'),
    jobsSearch: new Route('/user/jobs/search'),
    schemes: new Route('/user/schemes'),
    schemesSearch: new Route('/user/schemes/search'),
    schemeDetails: new Route('/user/schemes/details'),
    servicesSearch: new Route('/user/services/search'),
    serviceDetails: new Route('/user/services/details'),
    skillsSearch: new Route('/user/skills/search'),
    skillDetails: new Route('/user/skills/details'),
    productsSearch: new Route('/user/products/search'),
    productDetails: new Route('/user/products/details'),
    news: new Route('/user/news'),
    newsDetails: new Route('/user/news/details'),
    notification: new Route('/user/notification'),
    profile: new Route('/user/profile'),
    aboutYou: new Route('/user/profile/about-you'),
    locationDetails: new Route('/user/profile/location-details'),
    areaOfInterest: new Route('/user/profile/area-of-interest'),
    familyDetails: new Route('/user/profile/family-details'),
    jobEligibility: new Route('/user/profile/job-eligibility'),
    schemeEligibility: new Route('/user/profile/scheme-eligibility'),
    otherDetails: new Route('/user/profile/other-details'),
    hospital: new Route('/user/hospital'),
    needs: new Route('/user/needs'),
    addNeeds: new Route('/user/needs/add'),
    settings: new Route('/user/settings'),
    deleteAccount: new Route('/user/settings/delete-account'),
    mySurveys: new Route('/user/my-surveys'),
  },
  auth: {
    login: new Route('/auth/login', { middleware: [] }),
    blocked: new Route('/auth/blocked', { middleware: [] }),
  },
  common: {
    webview: new Route('/wv', { middleware: [] }),
  },

  back() {
    if (!navigationRef.isReady() || !navigationRef.canGoBack()) {return;}
    blurActiveElement();
    navigationRef.dispatch(CommonActions.goBack());
  },

  deepLink(route?: string | null) {
    if (!route) {return;}

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


    const [path, queryString] = route.split('?');
    const query = queryString ? parseQueryString(queryString) : undefined;
    const target = Route.find(path);
    if (!target) {
      Toast.show('Coming soon', Toast.SHORT);
      return;
    }
    target.navigate(query);
  },
};
