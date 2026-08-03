import React from 'react';
import { Image, StyleSheet, Text } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { NotificationTileFrame } from './NotificationTileFrame';
import { BannerNotification } from './NotificationModel';

export function BannerNotificationTile({
  title,
  description,
  image,
  status,
  time,
  onPress,
}: BannerNotification) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress}>
      <Image source={{ uri: image }} style={[styles.image, Themer.iosRadius(10)]} resizeMode="cover" />
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </NotificationTileFrame>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 140,
    marginBottom: 10,
  },
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
