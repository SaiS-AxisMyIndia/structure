import React from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainBar } from '../appbar/MainBar';
import { BottomBar, BottomType } from './BottomBar';
import { AppColors } from '../../theme/AppColors';
import { Routes } from '../../routes/registry';
import { HomeBody } from '../../../core/user/home/HomePage';
import { SubscriptionBody } from '../../../core/user/subscription/SubscriptionPage';
import { SearchBody } from '../../../core/user/search/SearchPage';
import { CartBody } from '../../../core/user/cart/CartPage';
import { ProfileTabBody } from '../../../core/user/profile/ProfilePage';

export type BottomBarViewProps = {
  tab: BottomType;
  onTabChange: (tab: BottomType) => void;
};

const BODIES: Record<BottomType, React.ComponentType> = {
  [BottomType.home]: HomeBody,
  [BottomType.subscription]: SubscriptionBody,
  [BottomType.search]: SearchBody,
  [BottomType.cart]: CartBody,
  [BottomType.profile]: ProfileTabBody,
};

// Fully controlled - TabScreenView (via userTabConfig's renderBar) owns
// `tab` through the `/user/home` route's own `tab` param, not local state
// here, so that tapping a bottom-bar tab updates the URL (and so survives
// a reload) instead of just flipping an internal useState nothing else can
// see. Only ever rendered from TabScreenView's mobile/tablet branch, so
// there's no need for this component to re-check the breakpoint itself -
// the bottom-bar strip below always renders.
export function BottomBarView({ tab, onTabChange }: BottomBarViewProps) {
  const insets = useSafeAreaInsets();
  const ActiveBody = BODIES[tab];

  return (
    <>
      <StatusBar backgroundColor={AppColors.white} barStyle="dark-content" />
      <View style={{ height: insets.top, backgroundColor: AppColors.white }} />
      <SafeAreaView
        style={styles.safeArea}
        edges={['left', 'right']}
      >
        {/* No onNavChange here on purpose: MainBar's web nav only ever
            renders at the web-tier breakpoint (see showWebNav in
            MainBar.tsx), which this component is never rendered at in the
            first place. Leaving onNavChange unset falls through to
            MainBar's default: Routes.user[x].navigate() - each tab is
            still its own route/URL on web (TabScreenView's web branch, not
            this component, handles that). */}
        <MainBar
          value={tab}
          onNotificationPress={() => Routes.user.notification.navigate()}
          // Profile is one of the 5 bottom tabs now - switch to it in place
          // (like tapping the tab itself) instead of pushing a second,
          // separately-chromed ProfilePage on top of it.
          onProfilePress={() => onTabChange(BottomType.profile)}
        />
        <View style={styles.bodyContainer}>
          <ActiveBody />
        </View>
        <BottomBar value={tab} onChange={onTabChange} />
      </SafeAreaView>
      <View style={{ height: insets.bottom, backgroundColor: AppColors.white }} />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.neutral,
  },
  bodyContainer: {
    flex: 1,
  },
});
