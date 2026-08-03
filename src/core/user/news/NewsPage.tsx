import React from 'react';
import { BottomBarView } from '../../../config/components/bottombar/BottomBarView';
import { BottomType } from '../../../config/components/bottombar/BottomBar';

export function NewsPage() {
  return <BottomBarView initialTab={BottomType.news} />;
}
