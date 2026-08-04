import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { AAudioPlayer } from '../players/AAudioPlayer';
import { NotificationTileFrame } from './NotificationTileFrame';
import { AudioNotification } from './NotificationModel';

export function AudioNotificationTile({
  title,
  description,
  audio,
  status,
  time,
  onPress,
  isVisible = true,
}: AudioNotification & { isVisible?: boolean }) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress}>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      <View style={styles.playerWrap}>
        <AAudioPlayer source={audio} isActive={isVisible} />
      </View>
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
  playerWrap: {
    marginTop: 12,
  },
});
