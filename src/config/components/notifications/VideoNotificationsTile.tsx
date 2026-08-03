import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { NotificationTileFrame } from './NotificationTileFrame';
import { VideoNotification } from './NotificationModel';

export function VideoNotificationsTile({
  title,
  description,
  thumbnail,
  status,
  time,
  onPress,
}: VideoNotification) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress}>
      <View style={[styles.imageWrap, Themer.iosRadius(10)]}>
        <Image source={{ uri: thumbnail }} style={styles.image} resizeMode="cover" />
        <View style={styles.playButton}>
          <SvgIcon icon={SvgIcons.play} size={20} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </NotificationTileFrame>
  );
}

const styles = StyleSheet.create({
  imageWrap: {
    width: '100%',
    height: 140,
    marginBottom: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 52,
    height: 52,
    marginTop: -26,
    marginLeft: -26,
    borderRadius: 26,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
