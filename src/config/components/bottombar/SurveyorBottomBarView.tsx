import React, { useState } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainSBar } from '../appbar/MainSBar';
import { SurveyorBottomBar, SurveyorBottomType } from './SurveyorBottomBar';
import { AppColors } from '../../theme/AppColors';
import { DashboardBody } from '../../../core/surveyor/dashboard/DashboardBody';
import { SurveySBody } from '../../../core/surveyor/survey/SurveySBody';
import { NeedsSBody } from '../../../core/surveyor/needs/NeedsSBody';
import { SettingsSBody } from '../../../core/surveyor/settings/SettingsSBody';
import { AStorage } from '../../storage/AStorage';

export type SurveyorBottomBarViewProps = {
  initialTab: SurveyorBottomType;
};

const BODIES: Record<SurveyorBottomType, React.ComponentType> = {
  [SurveyorBottomType.dashboard]: DashboardBody,
  [SurveyorBottomType.surveys]: SurveySBody,
  [SurveyorBottomType.needs]: NeedsSBody,
  [SurveyorBottomType.settings]: SettingsSBody,
};

export function SurveyorBottomBarView({ initialTab }: SurveyorBottomBarViewProps) {
  const [tab, setTab] = useState<SurveyorBottomType>(initialTab);
  const insets = useSafeAreaInsets();
  const ActiveBody = BODIES[tab];
  const { offlineMode, setOfflineMode } = AStorage.useOfflineMode();

  return (
    <>
      <StatusBar backgroundColor={AppColors.white} barStyle="dark-content" />
      <View style={{ height: insets.top, backgroundColor: AppColors.white }} />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: AppColors.neutral }}
        edges={['left', 'right']}
      >
        <MainSBar offline={offlineMode} onModeChange={setOfflineMode} />
        <View style={{ flex: 1 }}>
          <ActiveBody />
        </View>
        <SurveyorBottomBar value={tab} onChange={setTab} />
      </SafeAreaView>
      <View style={{ height: insets.bottom, backgroundColor: AppColors.white }} />
    </>
  );
}
