import React from 'react';
import { BottomBarView } from './BottomBarView';
import { BottomType } from './BottomBar';
import { MainBar } from '../appbar/MainBar';
import { Routes } from '../../routes/registry';
import { TabScreenViewConfig } from '../layouts/TabScreenView';

// The one TabScreenViewConfig for the user app's 5 bottom tabs (Home/Jobs/
// News/Schemes/Explore) - every one of those tabs' Pages passes this same
// instance to TabScreenView. See TabScreenViewConfig's own comment for why
// this wiring lives here instead of inside TabScreenView itself.
export const userTabConfig: TabScreenViewConfig = {
  homeTab: BottomType.home,
  homeRoute: Routes.user.home,
  getTabRoute: tab => Routes.user[tab as BottomType],
  renderBar: (activeTab, onTabChange) => (
    <BottomBarView tab={activeTab as BottomType} onTabChange={onTabChange} />
  ),
  renderAppBar: tab => (
    <MainBar
      value={tab as BottomType}
      onNotificationPress={() => Routes.user.notification.navigate()}
      onProfilePress={() => Routes.user.profile.navigate()}
    />
  ),
};
