import React from 'react';
import { SurveyorBottomBarView } from '../../../config/components/bottombar/SurveyorBottomBarView';
import { SurveyorBottomType } from '../../../config/components/bottombar/SurveyorBottomBar';

export function DashboardPage() {
  return <SurveyorBottomBarView initialTab={SurveyorBottomType.dashboard} />;
}
