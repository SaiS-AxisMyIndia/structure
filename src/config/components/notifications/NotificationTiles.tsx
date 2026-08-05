import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AAudioPlayer } from '../players/AAudioPlayer';
import { AVideoPlayer } from '../players/AVideoPlayer';
import { Routes } from '../../routes/registry';
import {
  AudioNotification,
  BannerNotification,
  ImageNotification,
  LogoNotification,
  MessageNotification,
  NotificationItem,
  NotificationStatus,
  VideoNotification,
} from './NotificationModel';

// Default press behavior for every notification kind: follow its own
// `route` (a plain route path, or an `<Internal>`/`<External>` URL) - see
// Routes.deepLink(). Callers only need to override onPress when they want
// something other than that.
function pressNotification(route?: string) {
  Routes.deepLink(route);
}

type NotificationTileFrameProps = {
  status: NotificationStatus;
  time: string;
  onPress?: () => void;
  children: React.ReactNode;
};

function NotificationTileFrame({ status, time, onPress, children }: NotificationTileFrameProps) {
  return (
    <Pressable onPress={onPress} style={[styles.card, Themer.shadow()]}>
      {children}
      <View style={styles.footer}>
        <Text style={status === 'new' ? styles.statusNew : styles.statusRead}>
          {status === 'new' ? 'New' : 'Read'}
        </Text>
        <View style={styles.timeRow}>
          <Text style={styles.time}>{time}</Text>
          <SvgIcon icon={SvgIcons.chevronRight} size={16} />
        </View>
      </View>
    </Pressable>
  );
}

export function BannerNotificationTile({
  title,
  description,
  image,
  status,
  time,
  route,
  onPress,
}: BannerNotification & { onPress?: () => void }) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress ?? (() => pressNotification(route))}>
      <Image source={{ uri: image }} style={[styles.bannerImage, Themer.iosRadius(10)]} resizeMode="cover" />
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </NotificationTileFrame>
  );
}

const VIDEO_ASPECT_RATIO = 16 / 9;

export function VideoNotificationsTile({
  title,
  description,
  thumbnail,
  url,
  source,
  status,
  time,
  route,
  onPress,
  isVisible = true,
}: VideoNotification & { onPress?: () => void; isVisible?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress ?? (() => pressNotification(route))}>
      <View style={styles.videoPlayerWrap}>
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
            <Image source={{ uri: thumbnail }} style={styles.videoImage} resizeMode="cover" />
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

export function ImageNotificatonTile({
  title,
  description,
  thumbnail,
  status,
  time,
  route,
  onPress,
}: ImageNotification & { onPress?: () => void }) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress ?? (() => pressNotification(route))}>
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

export function LogoNotificationTile({
  title,
  description,
  logo,
  status,
  time,
  route,
  onPress,
}: LogoNotification & { onPress?: () => void }) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress ?? (() => pressNotification(route))}>
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

export function MessageNotificationTile({
  title,
  description,
  status,
  time,
  route,
  onPress,
}: MessageNotification & { onPress?: () => void }) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress ?? (() => pressNotification(route))}>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
    </NotificationTileFrame>
  );
}

export function AudioNotificationTile({
  title,
  description,
  audio,
  status,
  time,
  route,
  onPress,
  isVisible = true,
}: AudioNotification & { onPress?: () => void; isVisible?: boolean }) {
  return (
    <NotificationTileFrame status={status} time={time} onPress={onPress ?? (() => pressNotification(route))}>
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      <View style={styles.audioPlayerWrap}>
        <AAudioPlayer source={audio} isActive={isVisible} />
      </View>
    </NotificationTileFrame>
  );
}

export function renderNotificationTile(item: NotificationItem, isVisible: boolean) {
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusNew: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
  statusRead: {
    fontSize: 13,
    fontWeight: '500',
    color: AppColors.neutral300,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 13,
    color: AppColors.neutral400,
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
  bannerImage: {
    width: '100%',
    height: 140,
    marginBottom: 10,
  },
  videoPlayerWrap: {
    marginBottom: 10,
  },
  imageWrap: {
    width: '100%',
  },
  videoImage: {
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
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  audioPlayerWrap: {
    marginTop: 12,
  },
});
