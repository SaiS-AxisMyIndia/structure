import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { NotificationTileFrame } from './NotificationTileFrame';
import { LogoNotification } from './NotificationModel';

export function LogoNotificationTile({
  title,
  description,
  logo,
  status,
  time,
  onPress,
}: LogoNotification) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress}>
      <View style={styles.row}>
        <Image source={{ uri: logo }} style={styles.logo} resizeMode="cover" />
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
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
