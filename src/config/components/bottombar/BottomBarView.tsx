import React, { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainBar } from '../appbar/MainBar';
import { BottomBar, BottomType } from './BottomBar';
import { AppColors } from '../../theme/AppColors';
import { Routes } from '../../routes/registry';
import { HomeBody } from '../../../core/user/home/HomeBody';
import { JobsBody } from '../../../core/user/jobs/JobsBody';
import { SchemesBody } from '../../../core/user/schemes/SchemesBody';
import { NewsBody } from '../../../core/user/news/NewsBody';
import { ExploreBody } from '../../../core/user/explore/ExploreBody';

export type BottomBarViewProps = {
  initialTab: BottomType;
};

const BODIES: Record<BottomType, React.ComponentType> = {
  [BottomType.home]: HomeBody,
  [BottomType.jobs]: JobsBody,
  [BottomType.schemes]: SchemesBody,
  [BottomType.news]: NewsBody,
  [BottomType.explore]: ExploreBody,
};

export function BottomBarView({ initialTab }: BottomBarViewProps) {
  const [tab, setTab] = useState<BottomType>(initialTab);
  const insets = useSafeAreaInsets();
  const ActiveBody = BODIES[tab];

  return (
    <>
      <StatusBar backgroundColor={AppColors.white} barStyle="dark-content" />
      <View style={{ height: insets.top, backgroundColor: AppColors.white }} />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: AppColors.neutral }}
        edges={['left', 'right']}
      >
        <MainBar
          userName={'Mr. Pradeep Gupta'}
          onNotificationPress={() => Routes.user.notification.navigate()}
          onProfilePress={() => Routes.user.profile.navigate()}
        />
        <View style={{ flex: 1 }}>
          <ActiveBody />
        </View>
        <BottomBar value={tab} onChange={setTab} />
      </SafeAreaView>
      <View style={{ height: insets.bottom, backgroundColor: AppColors.white }} />
    </>
  );
}
