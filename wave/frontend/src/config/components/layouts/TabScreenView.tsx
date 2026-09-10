import React, { useEffect } from 'react';
import { useIsFocused, useRoute } from '@react-navigation/native';
import { useWindowDimensions } from 'react-native';
import { ScreenView } from './ScreenView';
import { AppConstants } from '../../constants/AppConstants';
import { ScreenLifecycleCallbacks, useLifecycleFromActive } from './useScreenLifecycle';

// A tab value is just a string here - keeps this layout free of any one bar
// system's own enum (BottomType, SurveyorBottomType, ...). Callers pass
// their own enum's members in; they happen to be plain strings already.
export type TabValue = string;

type TabRoute = {
  navigate: (query?: Record<string, unknown>) => void;
};

type HomeRoute = {
  navigate: (query?: Record<string, unknown>) => void;
  update: (query?: Record<string, unknown>) => void;
  replace: (query?: Record<string, unknown>) => void;
};

// Everything that differs between one bar system and another (BottomBarView
// vs SurveyorBottomBarView, MainBar vs MainSBar, Routes.user vs
// Routes.surveyor, BottomType vs SurveyorBottomType) is injected through
// this config instead of imported directly - that's what makes
// TabScreenView itself reusable for more than one bar system. Build one
// of these per system (see userTabConfig.tsx) and pass the same instance
// to every one of that system's tabs.
export type TabScreenViewConfig = {
  // The "home" tab's own value for this system - the one screen that owns
  // the bar container directly instead of redirecting into it.
  homeTab: TabValue;
  // The home screen's own route - what a non-home tab redirects into on
  // mobile/tablet, and what the bar's own onTabChange updates in place.
  homeRoute: HomeRoute;
  // Maps any tab value to that tab's own dedicated route - used only for
  // the reverse direction (crossing into web tier while a non-home tab is
  // active via ?tab=... on the home route).
  getTabRoute: (tab: TabValue) => TabRoute;
  // Renders the owning bar container (BottomBarView / SurveyorBottomBarView)
  // for the home screen on mobile/tablet. ReactElement, not ReactNode - it
  // always renders a concrete component, never null/undefined, which is
  // also what keeps TabScreenView's own return type narrow enough to use
  // as a JSX component itself.
  renderBar: (activeTab: TabValue, onTabChange: (tab: TabValue) => void) => React.ReactElement;
  // Renders the web-tier top chrome (MainBar / MainSBar) for a given tab.
  renderAppBar: (tab: TabValue) => React.ReactNode;
};

export type TabScreenViewProps = ScreenLifecycleCallbacks & {
  config: TabScreenViewConfig;
  // The enum member identifying which tab this particular screen is (can't
  // be named `enum` - reserved word, invalid as a destructured binding).
  tab: TabValue;
  body: React.ReactNode;
  isHome: boolean;
};

type ActiveTabQuery = {
  tab?: TabValue;
};

// Shared by every tab's Page in a bar system (the home tab included). On
// mobile/tablet, the bar container only ever lives inside the home screen -
// non-home tabs redirect there with this tab selected (via a `tab` route
// param on the home route, so it survives a reload and shows up in the
// URL) instead of mounting an independent instance. On web, each tab is
// still its own real route/URL, so it renders normally: the system's own
// top chrome + this tab's own body, no bar container, no tab-swap.
export function TabScreenView({ config, tab, body, isHome, onCreate, onResume, onPause, onDestroy }: TabScreenViewProps): React.ReactElement | null {
  const { width } = useWindowDimensions();
  const isWebTier = width >= AppConstants.breakPoints.tablet;
  const { params } = useRoute();
  // On web, each tab is its own real route, so navigation focus works the
  // same way it does for a standalone ScreenView page. On mobile/tablet,
  // only the isHome instance ever actually mounts real content - every
  // other tab's own TabScreenView instance redirects away immediately
  // (see the replace() effect below) and never renders anything, so
  // useIsFocused() alone can't tell "this tab" from "some other tab" the
  // way it can on web - BottomBarView/SurveyorBottomBarView swap which
  // Body is shown via local `tab` prop comparison, not by mounting a
  // separate focused route per tab. "Active" here means exactly that
  // comparison instead: the isHome instance, currently showing this tab.
  const isFocused = useIsFocused();
  // `...restParams` is anything beyond `tab` the current route was reached
  // with (e.g. Home's category grid cards navigate to
  // "/user/jobs?category=remote" - see Routes.deepLink) - both effects
  // below fold it back in wherever the screen's params end up living, so
  // it survives crossing between a tab's own route and the home route.
  // Stringified for the dependency arrays below since it's a fresh object
  // every render otherwise.
  const { tab: activeTab, ...restParams } = (params ?? {}) as ActiveTabQuery & Record<string, unknown>;
  const restParamsKey = JSON.stringify(restParams);

  const isActive = isWebTier ? isFocused : isHome && (activeTab ?? config.homeTab) === tab;
  useLifecycleFromActive(isActive, { onCreate, onResume, onPause, onDestroy });

  // replace(), not navigate() - a non-home tab reached directly (deep link,
  // cold start, Routes.user.x.navigate() from somewhere that doesn't
  // already have the home route in its stack) would otherwise get PUSHED
  // under the home route instead of swapped out. That leftover screen
  // still renders null (it's not home, still mobile/tablet), so pressing
  // back lands back on it, which immediately re-fires this same redirect -
  // a white-screen bounce that never actually goes anywhere. replace()
  // discards this screen instead of leaving it in the stack, so there's
  // nothing left to bounce back into. Web never hits this: its branch
  // below always renders real content, never null.
  useEffect(() => {
    if (!isWebTier && !isHome) {config.homeRoute.replace({ tab, ...restParams });}
    // restParams is a fresh object every render - restParamsKey is its
    // stable stand-in so this doesn't re-fire replace() every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWebTier, isHome, tab, restParamsKey, config]);

  // The reverse direction: if the window grows into web tier while sitting
  // on the home route with a non-home `tab` param (e.g. resizing the
  // browser, or rotating a tablet past the breakpoint), that tab needs to
  // become its own real route/URL instead of staying a query param on the
  // home route, matching web's per-tab-route design going the other way
  // too. Only fires from the isHome instance, since that's the only one
  // that ever carries a `tab` param in the first place.
  useEffect(() => {
    if (isHome && isWebTier && activeTab && activeTab !== config.homeTab) {
      config.getTabRoute(activeTab).navigate(restParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome, isWebTier, activeTab, restParamsKey, config]);

  if (!isWebTier) {
    if (!isHome) {return null;}

    // Clears out any restParams (e.g. `category`) alongside the tab switch -
    // update() shallow-merges, so without this a filter picked up via a
    // Home category card (see the replace() effect above) would otherwise
    // keep leaking onto whichever tab the user taps next in the bar itself.
    // Explicitly tapping a tab is a distinct "show me this tab, unfiltered"
    // action, not a continuation of whatever filtered it in.
    const clearedRestParams = Object.fromEntries(Object.keys(restParams).map(key => [key, undefined]));

    return config.renderBar(
      activeTab ?? config.homeTab,
      // update(), not navigate() - this is the home screen updating its
      // own params in place, not going to a different screen. Tapping the
      // bar never leaves the home screen.
      newTab => config.homeRoute.update({ tab: newTab, ...clearedRestParams }),
    );
  }

  return <ScreenView appbar={config.renderAppBar(tab)} body={body} />;
}
