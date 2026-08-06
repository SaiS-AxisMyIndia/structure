import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, ViewToken } from 'react-native';
import { TitleBar } from '../../../config/components/appbar/TitleBar';
import { ScreenView } from '../../../config/components/layouts/ScreenView';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { Routes } from '../../../config/routes/registry';
import { useNotificationController } from './NotificationController';
import { renderNotificationTile } from '../../../config/components/notifications/NotificationTiles';
import { NotificationItem } from '../../../config/components/notifications/NotificationModel';
import { ResponsiveView } from '../../../config/components/layouts/ResponsiveView';
import { MobileCenter, TabletCenter } from '../../../config/components/layouts/Center';

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

export function NotificationPage() {
  const controller = useNotificationController();
  const { notifications, loading, reload } = controller;
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisibleIds(new Set(viewableItems.map(v => (v.item as NotificationItem).id)));
    },
  ).current;

  return (
    <ScreenView
      appbar={<TitleBar title="Notifications" onBackPress={() => Routes.user.home.navigate()} />}
      body={
        <ResponsiveView
          mobile={
            <LoadingView
              controller={controller.loadingController}
              onRefresh={reload}
              body={
                <FlatList
                  data={notifications}
                  keyExtractor={item => item.id}
                  onRefresh={reload}
                  refreshing={loading}
                  contentContainerStyle={styles.list}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={VIEWABILITY_CONFIG}
                  renderItem={({ item }) => {
                    return <MobileCenter>{renderNotificationTile(item, visibleIds.has(item.id))}</MobileCenter>;
                  }}
                />
              }
            />
          }
          tablet={
            <LoadingView
              controller={controller.loadingController}
              onRefresh={reload}
              body={
                <FlatList
                  data={notifications}
                  keyExtractor={item => item.id}
                  onRefresh={reload}
                  refreshing={loading}
                  contentContainerStyle={styles.list}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={VIEWABILITY_CONFIG}
                  renderItem={({ item }) => {
                    return <TabletCenter>{renderNotificationTile(item, visibleIds.has(item.id))}</TabletCenter>;
                  }}
                />
              }
            />
          }
          web={
            <LoadingView
              controller={controller.loadingController}
              onRefresh={reload}
              body={
                <FlatList
                  data={notifications}
                  keyExtractor={item => item.id}
                  onRefresh={reload}
                  refreshing={loading}
                  contentContainerStyle={styles.list}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={VIEWABILITY_CONFIG}
                  renderItem={({ item }) => {
                    return <TabletCenter>{renderNotificationTile(item, visibleIds.has(item.id))}</TabletCenter>;
                  }}
                />
              }
            />
          }
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
});
