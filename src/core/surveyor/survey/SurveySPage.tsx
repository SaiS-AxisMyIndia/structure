import React from 'react';
import { SurveyorBottomBarView } from '../../../config/components/bottombar/SurveyorBottomBarView';
import { SurveyorBottomType } from '../../../config/components/bottombar/SurveyorBottomBar';

export function SurveySPage() {
  return <SurveyorBottomBarView initialTab={SurveyorBottomType.surveys} />;
}
