import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AVideoPlayer } from '../players/AVideoPlayer';
import { NotificationTileFrame } from './NotificationTileFrame';
import { VideoNotification } from './NotificationModel';

const VIDEO_ASPECT_RATIO = 16 / 9;

export function VideoNotificationsTile({
  title,
  description,
  thumbnail,
  url,
  source,
  status,
  time,
  onPress,
  isVisible = true,
}: VideoNotification & { isVisible?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress}>
      <View style={styles.playerWrap}>
        {source === 'youtube' ? (
          <AVideoPlayer
            source={url}
            sourceType={source}
            aspectRatio={VIDEO_ASPECT_RATIO}
            isActive={isVisible}
          />
        ) : isPlaying ? (
          <AVideoPlayer
            source={url}
            sourceType={source}
            aspectRatio={VIDEO_ASPECT_RATIO}
            autoPlay
            isActive={isVisible}
          />
        ) : (
          <View style={[styles.imageWrap, { aspectRatio: VIDEO_ASPECT_RATIO }, Themer.iosRadius(10)]}>
            <Image source={{ uri: thumbnail }} style={styles.image} resizeMode="cover" />
            <Pressable style={styles.playButton} onPress={() => setIsPlaying(true)}>
              <SvgIcon icon={SvgIcons.play} size={20} />
            </Pressable>
          </View>
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </NotificationTileFrame>
  );
}

const styles = StyleSheet.create({
  playerWrap: {
    marginBottom: 10,
  },
  imageWrap: {
    width: '100%',
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
