import React from 'react';
import { LinkingOptions, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { navigationRef, Routes } from './registry';
import { HomePage as UserHomePage } from '../../core/user/home/HomePage';
import { JobsPage } from '../../core/user/jobs/JobsPage';
import { SchemesPage } from '../../core/user/schemes/SchemesPage';
import { ServicesPage } from '../../core/user/services/ServicesPage';
import { NotificationPage } from '../../core/user/notification/NotificationPage';
import { ProfilePage } from '../../core/user/profile/ProfilePage';
import { NewsPage } from '../../core/user/news/NewsPage';
import { NewsDetailsPage } from '../../core/user/news_details/NewsDetailsPage';
import { ExplorePage } from '../../core/user/explore/ExplorePage';
import { DashboardPage as DashboardPage } from '../../core/surveyor/dashboard/DashboardPage';
import { SurveySPage } from '../../core/surveyor/survey/SurveySPage';
import { NeedsSPage } from '../../core/surveyor/needs/NeedsSPage';
import { SettingsSPage } from '../../core/surveyor/settings/SettingsSPage';
import { WebViewPage } from '../components/webview/WebViewPage';

export type AppRole = 'user' | 'surveyor';

const Stack = createNativeStackNavigator();

// Route names are already path-like strings (e.g. '/user/notification'), so
// the linking config is just those names mapped to themselves. This is what
// lets a URL like http://localhost:8080/user/notification - typed directly
// or landed on via a refresh - restore the matching screen instead of
// always falling back to the first one in the stack.
function buildLinking(role: AppRole): LinkingOptions<Record<string, object | undefined>> {
  const roleRoutes = role === 'user' ? Routes.user : Routes.surveyor;
  const screens: Record<string, string> = {};
  [...Object.values(roleRoutes), Routes.common.webview].forEach(route => {
    screens[route.name] = route.name.replace(/^\//, '');
  });

  return {
    prefixes: [],
    config: { screens },
  };
}

export function Router({ role }: { role: AppRole }) {
  return (
    <NavigationContainer ref={navigationRef} linking={buildLinking(role)}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {role === 'user' ? (
          <>
            <Stack.Screen
              name={Routes.user.home.name}
              component={UserHomePage}
            />
            <Stack.Screen
              name={Routes.user.jobs.name}
              component={JobsPage}
            />
            <Stack.Screen
              name={Routes.user.schemes.name}
              component={SchemesPage}
            />
            <Stack.Screen
              name={Routes.user.services.name}
              component={ServicesPage}
            />
            <Stack.Screen name={Routes.user.notification.name} component={NotificationPage} />
            <Stack.Screen name={Routes.user.profile.name} component={ProfilePage} />
            <Stack.Screen
              name={Routes.user.news.name}
              component={NewsPage}
            />
            <Stack.Screen name={Routes.user.newsDetails.name} component={NewsDetailsPage} />
            <Stack.Screen name={Routes.user.explore.name} component={ExplorePage} />
          </>
        ) : (
          <>
            <Stack.Screen name={Routes.surveyor.home.name} component={DashboardPage} />
            <Stack.Screen name={Routes.surveyor.surveyor.name} component={SurveySPage} />
            <Stack.Screen name={Routes.surveyor.needs.name} component={NeedsSPage} />
            <Stack.Screen name={Routes.surveyor.settings.name} component={SettingsSPage} />
          </>
        )}
        <Stack.Screen name={Routes.common.webview.name} component={WebViewPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}