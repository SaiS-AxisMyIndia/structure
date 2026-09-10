import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { OnLoadData, OnProgressData, OnVideoErrorData, VideoRef } from 'react-native-video';
import { notifyPlaybackStarted, notifyPlaybackStopped } from './ActiveMediaManager';

export type AVideoSourceType = 'internal' | 'public';

export type AVideoPlayerState = {
  isLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error?: string;
  resetToken: number;
};

export type AVideoPlayerController = AVideoPlayerState & {
  videoRef: React.RefObject<VideoRef | null>;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  onVideoLoad: (e: OnLoadData) => void;
  onVideoProgress: (e: OnProgressData) => void;
  onVideoEnd: () => void;
  onVideoError: (e: OnVideoErrorData) => void;
};

export function useAVideoPlayerController(
  source: string,
  sourceType: AVideoSourceType,
  autoPlay = false,
  isActive = true,
): AVideoPlayerController {
  const videoRef = useRef<VideoRef>(null);
  const mediaHandleRef = useRef({}).current;
  const isFocused = useIsFocused();

  const [state, setState] = useState<AVideoPlayerState>({
    isLoading: true,
    isPlaying: autoPlay,
    currentTime: 0,
    duration: 0,
    resetToken: 0,
  });
  const isPlayingRef = useRef(false);
  isPlayingRef.current = state.isPlaying;

  useEffect(() => {
    setState(prev => ({ isLoading: true, isPlaying: autoPlay, currentTime: 0, duration: 0, resetToken: prev.resetToken }));
    if (autoPlay) {
      notifyPlaybackStarted(mediaHandleRef, resetToStart);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const pause = useCallback(() => {
    videoRef.current?.pause();
    notifyPlaybackStopped(mediaHandleRef);
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [mediaHandleRef]);

  const resetToStart = useCallback(() => {
    videoRef.current?.seek(0);
    pause();
    setState(prev => ({ ...prev, currentTime: 0 }));
  }, [pause]);

  const play = useCallback(() => {
    notifyPlaybackStarted(mediaHandleRef, resetToStart);
    videoRef.current?.resume();
    setState(prev => ({ ...prev, isPlaying: true }));
  }, [mediaHandleRef, resetToStart]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const seek = useCallback((seconds: number) => {
    videoRef.current?.seek(seconds);
    setState(prev => ({ ...prev, currentTime: seconds }));
  }, []);

  const onVideoLoad = useCallback((e: OnLoadData) => {
    setState(prev => ({ ...prev, isLoading: false, duration: e.duration, currentTime: e.currentTime }));
  }, []);

  const onVideoProgress = useCallback((e: OnProgressData) => {
    setState(prev => ({ ...prev, currentTime: e.currentTime }));
  }, []);

  const onVideoEnd = useCallback(() => {
    videoRef.current?.seek(0);
    notifyPlaybackStopped(mediaHandleRef);
    setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, [mediaHandleRef]);

  const onVideoError = useCallback((e: OnVideoErrorData) => {
    notifyPlaybackStopped(mediaHandleRef);
    setState(prev => ({
      ...prev,
      isLoading: false,
      isPlaying: false,
      error: e.error.localizedDescription ?? e.error.errorString ?? 'Failed to load video',
    }));
  }, [mediaHandleRef]);

  useEffect(() => {
    if (!isFocused) {
      pause();
    }
  }, [isFocused, pause]);

  useEffect(() => {
    if (!isActive) {
      pause();
    }
  }, [isActive, pause]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next !== 'active') {
        pause();
      }
    });
    return () => subscription.remove();
  }, [pause]);

  useEffect(() => {
    return () => notifyPlaybackStopped(mediaHandleRef);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    videoRef,
    play,
    pause,
    toggle,
    seek,
    onVideoLoad,
    onVideoProgress,
    onVideoEnd,
    onVideoError,
  };
}
