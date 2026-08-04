import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { OnLoadData, OnProgressData, OnVideoErrorData, VideoRef } from 'react-native-video';
import { PLAYER_STATES, YoutubeIframeRef } from 'react-native-youtube-iframe';
import { notifyPlaybackStarted, notifyPlaybackStopped } from './ActiveMediaManager';

export type AVideoSourceType = 'youtube' | 'internal' | 'public';

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
  youtubeRef: React.MutableRefObject<YoutubeIframeRef | null>;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
  onVideoLoad: (e: OnLoadData) => void;
  onVideoProgress: (e: OnProgressData) => void;
  onVideoEnd: () => void;
  onVideoError: (e: OnVideoErrorData) => void;
  onYoutubeReady: () => void;
  onYoutubeError: (error: string) => void;
  onYoutubeChangeState: (state: PLAYER_STATES) => void;
};

export function useAVideoPlayerController(
  source: string,
  sourceType: AVideoSourceType,
  autoPlay = false,
  isActive = true,
): AVideoPlayerController {
  const videoRef = useRef<VideoRef>(null);
  const youtubeRef = useRef<YoutubeIframeRef>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const clearProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const startYoutubeProgressTimer = () => {
    clearProgressTimer();
    progressTimer.current = setInterval(async () => {
      const seconds = await youtubeRef.current?.getCurrentTime();
      if (typeof seconds === 'number') {
        setState(prev => ({ ...prev, currentTime: seconds }));
      }
    }, 500);
  };

  useEffect(() => {
    setState(prev => ({ isLoading: true, isPlaying: autoPlay, currentTime: 0, duration: 0, resetToken: prev.resetToken }));
    if (autoPlay) {
      notifyPlaybackStarted(mediaHandleRef, resetToStart);
    }
    return () => clearProgressTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const pause = useCallback(() => {
    if (sourceType === 'youtube') {
      clearProgressTimer();
    } else {
      videoRef.current?.pause();
    }
    notifyPlaybackStopped(mediaHandleRef);
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [sourceType, mediaHandleRef]);

  const resetToStart = useCallback(() => {
    if (sourceType === 'youtube') {
      // YouTube's IFrame API only "probably" stays paused after seekTo() - it's not a
      // guaranteed contract, and can resume playback once re-buffering completes.
      // Force-remounting the iframe sidesteps that entirely: a freshly loaded video
      // is unstarted at position 0 by default, with no seek/pause race involved.
      pause();
      setState(prev => ({ ...prev, currentTime: 0, resetToken: prev.resetToken + 1 }));
    } else {
      videoRef.current?.seek(0);
      pause();
      setState(prev => ({ ...prev, currentTime: 0 }));
    }
  }, [sourceType, pause]);

  const play = useCallback(() => {
    notifyPlaybackStarted(mediaHandleRef, resetToStart);
    if (sourceType === 'youtube') {
      startYoutubeProgressTimer();
    } else {
      videoRef.current?.resume();
    }
    setState(prev => ({ ...prev, isPlaying: true }));
  }, [sourceType, mediaHandleRef, resetToStart]);

  const toggle = useCallback(() => {
    if (isPlayingRef.current) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const seek = useCallback(
    (seconds: number) => {
      if (sourceType === 'youtube') {
        youtubeRef.current?.seekTo(seconds, true);
      } else {
        videoRef.current?.seek(seconds);
      }
      setState(prev => ({ ...prev, currentTime: seconds }));
    },
    [sourceType],
  );

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

  const onYoutubeReady = useCallback(() => {
    youtubeRef.current?.getDuration().then(duration => {
      setState(prev => ({ ...prev, isLoading: false, duration }));
    });
  }, []);

  const onYoutubeError = useCallback((error: string) => {
    clearProgressTimer();
    notifyPlaybackStopped(mediaHandleRef);
    setState(prev => ({ ...prev, isLoading: false, isPlaying: false, error }));
  }, [mediaHandleRef]);

  const onYoutubeChangeState = useCallback((playerState: PLAYER_STATES) => {
    if (playerState === PLAYER_STATES.PLAYING) {
      notifyPlaybackStarted(mediaHandleRef, resetToStart);
      setState(prev => ({ ...prev, isPlaying: true }));
      startYoutubeProgressTimer();
    } else if (playerState === PLAYER_STATES.BUFFERING) {
      setState(prev => ({ ...prev, isLoading: true }));
    } else if (playerState === PLAYER_STATES.PAUSED) {
      clearProgressTimer();
      notifyPlaybackStopped(mediaHandleRef);
      setState(prev => ({ ...prev, isPlaying: false }));
    } else if (playerState === PLAYER_STATES.ENDED) {
      clearProgressTimer();
      notifyPlaybackStopped(mediaHandleRef);
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0, resetToken: prev.resetToken + 1 }));
    }
  }, [mediaHandleRef, resetToStart]);

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
    youtubeRef,
    play,
    pause,
    toggle,
    seek,
    onVideoLoad,
    onVideoProgress,
    onVideoEnd,
    onVideoError,
    onYoutubeReady,
    onYoutubeError,
    onYoutubeChangeState,
  };
}
