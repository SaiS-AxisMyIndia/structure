import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { ImageLoader } from '../images/ImageLoader';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AVideoPlayer } from '../players/AVideoPlayer';
import { NewsContentBlock } from './NewsDetailsModel';

export function NewsContentBlockView({ block }: { block: NewsContentBlock }) {
  switch (block.kind) {
    case 'text':
      return <TextBlockView block={block} />;
    case 'banner':
      return <BannerBlockView block={block} />;
    case 'video':
      return <VideoBlockView block={block} />;
  }
}

function TextBlockView({ block }: { block: Extract<NewsContentBlock, { kind: 'text' }> }) {
  return (
    <Text style={styles.text}>{block.text}</Text>
  );
}

function BannerBlockView({ block }: { block: Extract<NewsContentBlock, { kind: 'banner' }> }) {
  const aspectRatio = block.aspectRatio ?? 16 / 9;
  return (
    <View style={styles.bannerWrap}>
      <ImageLoader source={{ uri: block.image }} style={styles.banner} aspectRatio={aspectRatio} borderRadius={10} />
    </View>
  );
}

function VideoBlockView({ block }: { block: Extract<NewsContentBlock, { kind: 'video' }> }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const aspectRatio = block.aspectRatio ?? 16 / 9;

  if (block.videoSource === 'youtube') {
    return (
      <View style={styles.videoWrap}>
        <AVideoPlayer source={block.videoUrl} sourceType={block.videoSource} aspectRatio={aspectRatio} />
      </View>
    );
  }

  if (isPlaying) {
    return (
      <View style={styles.videoWrap}>
        <AVideoPlayer source={block.videoUrl} sourceType={block.videoSource} aspectRatio={aspectRatio} autoPlay />
      </View>
    );
  }

  return (
    <View style={styles.videoWrap}>
      <View style={[styles.imageWrap, { aspectRatio }, Themer.iosRadius(10)]}>
        <ImageLoader source={{ uri: block.thumbnail }} style={styles.image} />
        <Pressable style={styles.playButton} onPress={() => setIsPlaying(true)}>
          <SvgIcon icon={SvgIcons.play} size={20} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.neutral500,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  bannerWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  banner: {
    width: '100%',
  },
  videoWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
});
