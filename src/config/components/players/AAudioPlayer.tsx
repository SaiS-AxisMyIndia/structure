import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { useAAudioPlayerController } from './AAudioPlayerController';
import { PlayerProgressTrack } from './PlayerProgressTrack';
import { SpinningRing } from './SpinningRing';

export type AAudioPlayerProps = {
  source: string;
  title?: string;
};

const RING_SIZE = 40;
const RING_STROKE = 1.5;

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function fileNameFromSource(source: string): string {
  const fileName = source.split(/[?#]/)[0].split('/').pop() ?? source;
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

export function AAudioPlayer({ source, title }: AAudioPlayerProps) {
  const player = useAAudioPlayerController(source);
  const committedProgress = player.duration > 0 ? player.currentTime / player.duration : 0;
  const displayTitle = title || fileNameFromSource(source);

  return (
    <View style={styles.container}>
      <View style={styles.buttonWrap}>
        <Pressable
          onPress={player.toggle}
          disabled={player.isLoading || !!player.error}
          style={styles.playButton}
        >
          <SvgIcon icon={player.isPlaying ? SvgIcons.pause : SvgIcons.play} size={16} />
        </Pressable>
        {player.isLoading && (
          <View style={styles.loadingRing}>
            <SpinningRing size={RING_SIZE} strokeWidth={RING_STROKE} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {displayTitle}
        </Text>
        <PlayerProgressTrack
          progress={committedProgress}
          onSeekRatio={ratio => player.seek(ratio * player.duration)}
        />
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>{formatTime(player.currentTime)}</Text>
          <Text style={styles.timeLabel}>
            {player.error ? player.error : formatTime(player.duration)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.primaryBg2,
    borderRadius: 12,
    padding: 10,
    gap: 10,
  },
  buttonWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
  },
  body: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.neutral500,
    marginBottom: 6,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeLabel: {
    fontSize: 11,
    color: AppColors.neutral300,
  },
});
