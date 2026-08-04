import React, { useRef, useState } from 'react';
import { FlatList, StyleSheet, ViewToken } from 'react-native';
import { TitleBar } from '../../../config/components/appbar/TitleBar';
import { ScreenView } from '../../../config/components/layouts/ScreenView';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { Routes } from '../../../config/routes/registry';
import { useNotificationController } from './NotificationController';
import { BannerNotificationTile } from '../../../config/components/notifications/BannerNotificationTile';
import { VideoNotificationsTile } from '../../../config/components/notifications/VideoNotificationsTile';
import { ImageNotificatonTile } from '../../../config/components/notifications/ImageNotificatonTile';
import { LogoNotificationTile } from '../../../config/components/notifications/LogoNotificationTile';
import { MessageNotificationTile } from '../../../config/components/notifications/MessageNotificationTile';
import { AudioNotificationTile } from '../../../config/components/notifications/AudioNotificationTile';
import { NotificationItem } from '../../../config/components/notifications/NotificationModel';
import { ResponsiveView } from '../../../config/components/layouts/ResponsiveView';
import { MobileCenter } from '../../../config/components/layouts/Center';

const VIEWABILITY_CONFIG = { itemVisiblePercentThreshold: 60 };

function renderNotificationTile(item: NotificationItem, isVisible: boolean) {
  switch (item.kind) {
    case 'banner':
      return <BannerNotificationTile {...item} />;
    case 'video':
      return <VideoNotificationsTile {...item} isVisible={isVisible} />;
    case 'image':
      return <ImageNotificatonTile {...item} />;
    case 'logo':
      return <LogoNotificationTile {...item} />;
    case 'message':
      return <MessageNotificationTile {...item} />;
    case 'audio':
      return <AudioNotificationTile {...item} isVisible={isVisible} />;
  }
}

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
