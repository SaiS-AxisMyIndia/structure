import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
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

function renderNotificationTile(item: NotificationItem) {
  switch (item.kind) {
    case 'banner':
      return <BannerNotificationTile {...item} />;
    case 'video':
      return <VideoNotificationsTile {...item} />;
    case 'image':
      return <ImageNotificatonTile {...item} />;
    case 'logo':
      return <LogoNotificationTile {...item} />;
    case 'message':
      return <MessageNotificationTile {...item} />;
    case 'audio':
      return <AudioNotificationTile {...item} />;
  }
}

export function NotificationPage() {
  const controller = useNotificationController();
  const { notifications, loading, reload } = controller;

  return (
    <ScreenView
      appbar={<TitleBar title="Notifications" onBackPress={() => Routes.user.home.navigate()} />}
      body={
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
              renderItem={({ item }) => renderNotificationTile(item)}
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
