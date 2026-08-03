import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { NotificationTileFrame } from './NotificationTileFrame';
import { ImageNotification } from './NotificationModel';

export function ImageNotificatonTile({
  title,
  description,
  thumbnail,
  status,
  time,
  onPress,
}: ImageNotification) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress}>
      <View style={styles.row}>
        <Image source={{ uri: thumbnail }} style={[styles.thumbnail, Themer.iosRadius(8)]} resizeMode="cover" />
        <View style={styles.textCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {!!description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
      </View>
    </NotificationTileFrame>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnail: {
    width: 56,
    height: 56,
  },
  textCol: {
    flex: 1,
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
