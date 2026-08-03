import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { OnLoadData, OnProgressData, OnVideoErrorData, VideoRef } from 'react-native-video';
import { PLAYER_STATES, YoutubeIframeRef } from 'react-native-youtube-iframe';

export type AVideoSourceType = 'youtube' | 'internal' | 'public';

export type AVideoPlayerState = {
  isLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error?: string;
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
): AVideoPlayerController {
  const videoRef = useRef<VideoRef>(null);
  const youtubeRef = useRef<YoutubeIframeRef>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFocused = useIsFocused();

  const [state, setState] = useState<AVideoPlayerState>({
    isLoading: true,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
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
    setState({ isLoading: true, isPlaying: false, currentTime: 0, duration: 0 });
    return () => clearProgressTimer();
  }, [source]);

  const play = useCallback(() => {
    if (sourceType === 'youtube') {
      startYoutubeProgressTimer();
    } else {
      videoRef.current?.resume();
    }
    setState(prev => ({ ...prev, isPlaying: true }));
  }, [sourceType]);

  const pause = useCallback(() => {
    if (sourceType === 'youtube') {
      clearProgressTimer();
    } else {
      videoRef.current?.pause();
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [sourceType]);

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
    setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, []);

  const onVideoError = useCallback((e: OnVideoErrorData) => {
    setState(prev => ({
      ...prev,
      isLoading: false,
      isPlaying: false,
      error: e.error.localizedDescription ?? e.error.errorString ?? 'Failed to load video',
    }));
  }, []);

  const onYoutubeReady = useCallback(() => {
    youtubeRef.current?.getDuration().then(duration => {
      setState(prev => ({ ...prev, isLoading: false, duration }));
    });
  }, []);

  const onYoutubeError = useCallback((error: string) => {
    clearProgressTimer();
    setState(prev => ({ ...prev, isLoading: false, isPlaying: false, error }));
  }, []);

  const onYoutubeChangeState = useCallback((playerState: PLAYER_STATES) => {
    if (playerState === PLAYER_STATES.PLAYING) {
      setState(prev => ({ ...prev, isPlaying: true }));
      startYoutubeProgressTimer();
    } else if (playerState === PLAYER_STATES.BUFFERING) {
      setState(prev => ({ ...prev, isLoading: true }));
    } else if (playerState === PLAYER_STATES.PAUSED) {
      clearProgressTimer();
      setState(prev => ({ ...prev, isPlaying: false }));
    } else if (playerState === PLAYER_STATES.ENDED) {
      clearProgressTimer();
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  }, []);

  useEffect(() => {
    if (!isFocused) {
      pause();
    }
  }, [isFocused, pause]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next !== 'active') {
        pause();
      }
    });
    return () => subscription.remove();
  }, [pause]);

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
