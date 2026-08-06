import React, { useState } from 'react';
import { Pressable, Share, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { ImageLoader } from '../images/ImageLoader';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AVideoPlayer } from '../players/AVideoPlayer';
import { Routes } from '../../routes/registry';
import { DateFormatter } from '../../utils/DateFormatter';
import { BannerNewsItem, CompactNewsItem, NewsItem, VideoNewsItem } from './NewsModel';

export function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`;
  if (views >= 1_000) return `${Math.round(views / 1_000)}k`;
  return String(views);
}

// Same press/share behavior everywhere a news tile appears (feed, related
// list, Home) - defaulted here so callers only need to override it when
// they actually want something different.
function pressNews(id: string) {
  Routes.user.newsDetails.navigate({ id });
}

function shareNews(id: string, title: string) {
  Share.share({ message: title, url: Routes.user.newsDetails.shareUrl({ id }) }).catch(() => {});
}

const ASPECT_RATIO = 16 / 9;

type NewsTileFrameProps = {
  source: string;
  sourceLogo: string;
  time: string;
  views: number;
  // Caps this tile's own width; unset (default) leaves it stretching to
  // fill its parent.
  maxWidth?: number;
  compactImageWidth?: number;
  onPress?: () => void;
  onSharePress?: () => void;
  children: React.ReactNode;
};

// Card's own marginHorizontal - subtracted below so a capped card still
// fits within the screen instead of overflowing past its margins.
const CARD_HORIZONTAL_MARGIN = 16;

function NewsTileFrame({
  source,
  sourceLogo,
  time,
  views,
  maxWidth,
  onPress,
  onSharePress,
  children,
}: NewsTileFrameProps) {
  const { width: windowWidth } = useWindowDimensions();
  // `alignSelf: 'stretch'` (in styles.card) only fills the card along its
  // parent's cross axis, which does nothing for width inside a horizontal
  // list (e.g. a "related" carousel). Setting an explicit width instead
  // makes the card stretch up to `maxWidth` in either layout direction.
  const cardWidth =
    maxWidth != null ? Math.min(windowWidth - CARD_HORIZONTAL_MARGIN * 2, maxWidth) : undefined;

  return (
    <Pressable onPress={onPress} style={[styles.card, Themer.shadow(), cardWidth != null && { width: cardWidth }]}>
      <View style={styles.header}>
        <ImageLoader source={{ uri: sourceLogo }} style={styles.logo} borderRadius={100} />
        <Text style={styles.source} numberOfLines={1}>
          {source}
        </Text>
        <Text style={styles.time}>{DateFormatter.smart(time)}</Text>
      </View>
      {children}
      <View style={styles.footer}>
        <Pressable onPress={onSharePress} hitSlop={8}>
          <SvgIcon icon={SvgIcons.share} size={18} />
        </Pressable>
        <View style={styles.viewsRow}>
          <SvgIcon icon={SvgIcons.eye} size={16} />
          <Text style={styles.viewsText}>{formatViews(views)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export type CompactNewsTileProps = CompactNewsItem & {
  // Caps this tile's own width; unset (default) leaves it stretching to
  // fill its parent.
  maxWidth?: number;
  compactImageWidth?: number;
  onPress?: () => void;
  onSharePress?: () => void;
};

export function CompactNewsTile({
  id,
  source,
  sourceLogo,
  time,
  title,
  image,
  views,
  maxWidth,
  compactImageWidth = 100,
  onPress,
  onSharePress,
}: CompactNewsTileProps) {
  return (
    <NewsTileFrame
      source={source}
      sourceLogo={sourceLogo}
      time={time}
      views={views}
      maxWidth={maxWidth}
      compactImageWidth={compactImageWidth}
      onPress={onPress ?? (() => pressNews(id))}
      onSharePress={onSharePress ?? (() => shareNews(id, title))}
    >
      <View style={styles.row}>
        <Text style={styles.compactTitle} numberOfLines={3}>
          {title}
        </Text>
        <ImageLoader source={{ uri: image }} style={styles.thumb} borderRadius={8} aspectRatio={ASPECT_RATIO} minWidth={compactImageWidth} />
      </View>
    </NewsTileFrame>
  );
}

export type BannerNewsTileProps = BannerNewsItem & {
  // Caps this tile's own width; unset (default) leaves it stretching to
  // fill its parent.
  maxWidth?: number;
  onPress?: () => void;
  onSharePress?: () => void;
};

export function BannerNewsTile({
  id,
  source,
  sourceLogo,
  time,
  title,
  image,
  views,
  aspectRatio = ASPECT_RATIO,
  maxWidth,
  onPress,
  onSharePress,
}: BannerNewsTileProps) {
  return (
    <NewsTileFrame
      source={source}
      sourceLogo={sourceLogo}
      time={time}
      views={views}
      maxWidth={maxWidth}
      onPress={onPress ?? (() => pressNews(id))}
      onSharePress={onSharePress ?? (() => shareNews(id, title))}
    >
      <ImageLoader source={{ uri: image }} style={styles.bannerImage} aspectRatio={aspectRatio} borderRadius={10} />
      <Text style={styles.title} numberOfLines={3}>
        {title}
      </Text>
    </NewsTileFrame>
  );
}

export type VideoNewsTileProps = VideoNewsItem & {
  // Caps this tile's own width; unset (default) leaves it stretching to
  // fill its parent.
  maxWidth?: number;
  onPress?: () => void;
  onSharePress?: () => void;
};

export function VideoNewsTile({
  id,
  source,
  sourceLogo,
  time,
  title,
  image,
  videoUrl,
  videoSource,
  views,
  aspectRatio = ASPECT_RATIO,
  maxWidth,
  onPress,
  onSharePress,
}: VideoNewsTileProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <NewsTileFrame
      source={source}
      sourceLogo={sourceLogo}
      time={time}
      views={views}
      maxWidth={maxWidth}
      onPress={onPress ?? (() => pressNews(id))}
      onSharePress={onSharePress ?? (() => shareNews(id, title))}
    >
      <View style={styles.playerWrap}>
        {videoSource === 'youtube' ? (
          <AVideoPlayer source={videoUrl} sourceType={videoSource} aspectRatio={aspectRatio} />
        ) : isPlaying ? (
          <AVideoPlayer source={videoUrl} sourceType={videoSource} aspectRatio={aspectRatio} autoPlay />
        ) : (
          <View style={[styles.videoImageWrap, { aspectRatio }, Themer.iosRadius(10)]}>
            <ImageLoader source={{ uri: image }} style={styles.videoImage} />
            <Pressable style={styles.playButton} onPress={() => setIsPlaying(true)}>
              <SvgIcon icon={SvgIcons.play} size={20} />
            </Pressable>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={3}>
        {title}
      </Text>
    </NewsTileFrame>
  );
}

export function renderNewsTile(item: NewsItem, onPress?: () => void, onSharePress?: () => void) {
  switch (item.kind) {
    case 'banner':
      return <BannerNewsTile {...item} onPress={onPress} onSharePress={onSharePress} />;
    case 'compact':
      return <CompactNewsTile {...item} onPress={onPress} onSharePress={onSharePress} />;
    case 'video':
      return <VideoNewsTile {...item} onPress={onPress} onSharePress={onSharePress} />;
  }
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: AppColors.white,
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 8,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  logo: {
    width: 28,
    height: 28,
  },
  source: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  time: {
    fontSize: 13,
    color: AppColors.neutral300,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 13,
    color: AppColors.neutral400,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  compactTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  thumb: {
    width: 64,
    height: 64,
  },
  bannerImage: {
    width: '100%',
    marginBottom: 10,
  },
  playerWrap: {
    marginBottom: 10,
  },
  videoImageWrap: {
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
});
