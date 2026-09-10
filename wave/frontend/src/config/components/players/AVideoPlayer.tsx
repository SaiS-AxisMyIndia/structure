import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Video, { ResizeMode } from 'react-native-video';
import { AppColors } from '../../theme/AppColors';
import { AStorage } from '../../storage/AStorage';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AVideoPlayerController, AVideoSourceType, useAVideoPlayerController } from './AVideoPlayerController';
import { PlayerProgressTrack } from './PlayerProgressTrack';
import { SpinningRing } from './SpinningRing';

export type AVideoPlayerProps = {
  source: string;
  sourceType: AVideoSourceType;
  aspectRatio?: number;
  autoPlay?: boolean;
  isActive?: boolean;
  // Defaults to 12 (the original rounded-corner look) - a caller
  // embedding this flush against a flat-edged card (e.g. SkillTile's
  // hero media, which has no radius of its own) can pass 0 instead.
  borderRadius?: number;
};

const CONTROLS_AUTO_HIDE_MS = 3000;

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function AVideoPlayer({
  source,
  sourceType,
  aspectRatio = 16 / 9,
  autoPlay = false,
  isActive = true,
  borderRadius = 10,
}: AVideoPlayerProps) {
  const player = useAVideoPlayerController(source, sourceType, autoPlay, isActive);

  return (
    <NativeVideoView
      source={source}
      sourceType={sourceType}
      aspectRatio={aspectRatio}
      borderRadius={borderRadius}
      player={player}
    />
  );
}

type VideoViewProps = {
  source: string;
  sourceType: AVideoSourceType;
  aspectRatio: number;
  borderRadius: number;
  player: AVideoPlayerController;
};

function useControlsAutoHide(isPlaying: boolean) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const scheduleAutoHide = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), CONTROLS_AUTO_HIDE_MS);
  }, []);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (isPlaying) {
      scheduleAutoHide();
    }
  }, [isPlaying, scheduleAutoHide]);

  useEffect(() => {
    if (isPlaying) {
      scheduleAutoHide();
    } else {
      clearHideTimer();
      setControlsVisible(true);
    }
    return clearHideTimer;
  }, [isPlaying, scheduleAutoHide]);

  return { controlsVisible, revealControls };
}

function NativeVideoView({ source, sourceType, aspectRatio, borderRadius, player }: VideoViewProps) {
  const committedProgress = player.duration > 0 ? player.currentTime / player.duration : 0;
  const [isMuted, setIsMuted] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    if (sourceType !== 'internal') {return;}
    AStorage.getAuthToken().then(setAuthToken);
  }, [sourceType]);

  const { controlsVisible, revealControls } = useControlsAutoHide(player.isPlaying);

  const handleTogglePress = () => {
    player.toggle();
    revealControls();
  };

  const handleMutePress = () => {
    setIsMuted(prev => !prev);
    revealControls();
  };

  return (
    <View style={[styles.container, { borderRadius }]}>
      <View style={[styles.surface, { aspectRatio }]}>
        <Video
          ref={player.videoRef}
          source={{
            uri: source,
            headers: sourceType === 'internal' && authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          paused={!player.isPlaying}
          muted={isMuted}
          onLoad={player.onVideoLoad}
          onProgress={player.onVideoProgress}
          onEnd={player.onVideoEnd}
          onError={player.onVideoError}
        />
        {/* Not using Pressable's `disabled` prop: a disabled Pressable
            doesn't claim the touch responder, so while this overlay is
            "disabled" during buffering, taps fall through to the
            notification card underneath and trigger its navigation
            instead. Keeping it enabled and no-op'ing while loading keeps
            every tap on the video surface contained here. */}
        <Pressable
          style={styles.tapOverlay}
          onPress={() => {
            if (player.isLoading) {return;}
            revealControls();
          }}
        />
        {player.isLoading && (
          <View style={styles.centerButton}>
            <SpinningRing size={40} color={AppColors.white} />
          </View>
        )}
        {!player.isLoading && controlsVisible && (
          <Pressable style={styles.centerButton} onPress={handleTogglePress}>
            <SvgIcon icon={player.isPlaying ? SvgIcons.pause : SvgIcons.play} size={22} />
          </Pressable>
        )}
        {controlsVisible && !player.isLoading && (
          <View style={styles.controlsOverlay}>
            <Text style={styles.timeLabel}>
              {player.error ?? `${formatTime(player.currentTime)} / ${formatTime(player.duration)}`}
            </Text>
            <View style={styles.trackWrap}>
              <PlayerProgressTrack
                progress={committedProgress}
                onSeekRatio={ratio => {
                  player.seek(ratio * player.duration);
                  revealControls();
                }}
              />
            </View>
            <Pressable onPress={handleMutePress} style={styles.muteButton}>
              <SvgIcon
                icon={isMuted ? SvgIcons.speakerOff : SvgIcons.speaker}
                size={16}
                color={isMuted ? AppColors.secondary : AppColors.white}
              />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  surface: {
    width: '100%',
    backgroundColor: AppColors.black,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  tapOverlay: {
    ...StyleSheet.absoluteFillObject,
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
  controlsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  trackWrap: {
    flex: 1,
  },
  muteButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeLabel: {
    fontSize: 11,
    color: AppColors.white,
  },
});
