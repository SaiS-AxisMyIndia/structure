import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { NotificationTileFrame } from './NotificationTileFrame';
import { MessageNotification } from './NotificationModel';

export function MessageNotificationTile({
  title,
  description,
  status,
  time,
  onPress,
}: MessageNotification) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </NotificationTileFrame>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  description: {
    fontSize: 13,
    color: AppColors.neutral400,
    marginTop: 2,
  },
});
