import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Video, { ResizeMode } from 'react-native-video';
import YoutubeIframe from 'react-native-youtube-iframe';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AVideoSourceType, useAVideoPlayerController } from './AVideoPlayerController';
import { PlayerProgressTrack } from './PlayerProgressTrack';
import { SpinningRing } from './SpinningRing';

export type AVideoPlayerProps = {
  source: string;
  sourceType: AVideoSourceType;
  width?: number;
};

const YOUTUBE_ID_PATTERN = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

function extractYoutubeId(source: string): string {
  return source.match(YOUTUBE_ID_PATTERN)?.[1] ?? source;
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function AVideoPlayer({ source, sourceType, width = 320 }: AVideoPlayerProps) {
  const player = useAVideoPlayerController(source, sourceType);
  const height = (width * 9) / 16;
  const committedProgress = player.duration > 0 ? player.currentTime / player.duration : 0;

  return (
    <View style={[styles.container, { width }]}>
      <View style={[styles.surface, { width, height }]}>
        {sourceType === 'youtube' ? (
          <YoutubeIframe
            ref={player.youtubeRef}
            videoId={extractYoutubeId(source)}
            width={width}
            height={height}
            play={player.isPlaying}
            onReady={player.onYoutubeReady}
            onError={player.onYoutubeError}
            onChangeState={player.onYoutubeChangeState}
          />
        ) : (
          <Video
            ref={player.videoRef}
            source={{ uri: source }}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            paused={!player.isPlaying}
            onLoad={player.onVideoLoad}
            onProgress={player.onVideoProgress}
            onEnd={player.onVideoEnd}
            onError={player.onVideoError}
          />
        )}
        <Pressable style={styles.tapOverlay} onPress={player.toggle} disabled={player.isLoading}>
          {!player.isPlaying && !player.isLoading && (
            <View style={styles.centerButton}>
              <SvgIcon icon={SvgIcons.play} size={22} />
            </View>
          )}
        </Pressable>
        {player.isLoading && (
          <View style={styles.centerButton}>
            <SpinningRing size={40} color={AppColors.white} />
          </View>
        )}
      </View>
      <View style={styles.controlsRow}>
        <Pressable onPress={player.toggle} disabled={player.isLoading} style={styles.playButton}>
          <SvgIcon icon={player.isPlaying ? SvgIcons.pause : SvgIcons.play} size={14} />
        </Pressable>
        <View style={styles.trackWrap}>
          <PlayerProgressTrack
            progress={committedProgress}
            onSeekRatio={ratio => player.seek(ratio * player.duration)}
          />
        </View>
        <Text style={styles.timeLabel}>
          {player.error ?? `${formatTime(player.currentTime)} / ${formatTime(player.duration)}`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.primaryBg2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  surface: {
    backgroundColor: AppColors.black,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  tapOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 44,
    height: 44,
    marginTop: -22,
    marginLeft: -22,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  playButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackWrap: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: AppColors.neutral400,
  },
});
