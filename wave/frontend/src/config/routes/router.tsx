import React from 'react';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { flushPendingNavigations, navigationRef, Routes } from './registry';
import { HomePage as UserHomePage } from '../../core/user/home/HomePage';
import { SubscriptionPage } from '../../core/user/subscription/SubscriptionPage';
import { SearchPage } from '../../core/user/search/SearchPage';
import { CartPage } from '../../core/user/cart/CartPage';
import { ProfilePage } from '../../core/user/profile/ProfilePage';
import { WebViewPage } from '../components/webview/WebViewPage';
import { LoginPage } from '../../core/auth/login/LoginPage';
import { BlockedPage } from '../../core/auth/blocked/BlockedPage';

const Stack = createNativeStackNavigator();

// Route names are already path-like strings (e.g. '/user/notification'), so
// the linking config is just those names mapped to themselves. This is what
// lets a URL like http://localhost:8080/user/notification - typed directly
// or landed on via a refresh - restore the matching screen instead of
// always falling back to the first one in the stack.
function buildLinking(): LinkingOptions<Record<string, object | undefined>> {
  const screens: Record<string, string> = {};
  [
    ...Object.values(Routes.user),
    Routes.common.webview,
    Routes.auth.login,
    Routes.auth.blocked,
  ].forEach(route => {
    screens[route.name] = route.name.replace(/^\//, '');
  });

  return {
    prefixes: [],
    config: { screens },
  };
}

export function Router() {
  return (
    <NavigationContainer ref={navigationRef} linking={buildLinking()} onReady={flushPendingNavigations}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name={Routes.user.home.name} component={UserHomePage} />
        <Stack.Screen name={Routes.user.subscription.name} component={SubscriptionPage} />
        <Stack.Screen name={Routes.user.search.name} component={SearchPage} />
        <Stack.Screen name={Routes.user.cart.name} component={CartPage} />
        <Stack.Screen name={Routes.user.profile.name} component={ProfilePage} />
        <Stack.Screen name={Routes.common.webview.name} component={WebViewPage} />
        <Stack.Screen name={Routes.auth.login.name} component={LoginPage} />
        <Stack.Screen
          name={Routes.auth.blocked.name}
          component={BlockedPage}
          options={{ gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
