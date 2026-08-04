import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Sound from 'react-native-sound';
import { notifyPlaybackStarted, notifyPlaybackStopped } from './ActiveMediaManager';

export type AAudioPlayerState = {
  isLoading: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  error?: string;
};

export type AAudioPlayerController = AAudioPlayerState & {
  play: () => void;
  pause: () => void;
  stop: () => void;
  toggle: () => void;
  seek: (seconds: number) => void;
};

export function useAAudioPlayerController(source: string, isActive = true): AAudioPlayerController {
  const soundRef = useRef<Sound | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaHandleRef = useRef({}).current;
  const isFocused = useIsFocused();

  const [state, setState] = useState<AAudioPlayerState>({
    isLoading: false,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

  const clearProgressTimer = () => {
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }
  };

  const startProgressTimer = () => {
    clearProgressTimer();
    progressTimer.current = setInterval(() => {
      soundRef.current?.getCurrentTime(seconds => {
        setState(prev => ({ ...prev, currentTime: seconds }));
      });
    }, 250);
  };

  useEffect(() => {
    Sound.setCategory('Playback');
    setState({ isLoading: false, isPlaying: false, currentTime: 0, duration: 0 });

    return () => {
      clearProgressTimer();
      const sound = soundRef.current;
      soundRef.current = null;
      sound?.stop(() => sound.release());
    };
  }, [source]);

  const pause = useCallback(() => {
    soundRef.current?.pause();
    clearProgressTimer();
    notifyPlaybackStopped(mediaHandleRef);
    setState(prev => ({ ...prev, isPlaying: false }));
  }, [mediaHandleRef]);

  const stop = useCallback(() => {
    soundRef.current?.stop();
    clearProgressTimer();
    notifyPlaybackStopped(mediaHandleRef);
    setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
  }, [mediaHandleRef]);

  const startPlayback = useCallback(() => {
    const sound = soundRef.current;
    if (!sound) return;
    notifyPlaybackStarted(mediaHandleRef, stop);
    sound.play(() => {
      clearProgressTimer();
      notifyPlaybackStopped(mediaHandleRef);
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    });
    startProgressTimer();
    setState(prev => ({ ...prev, isPlaying: true }));
  }, [mediaHandleRef, stop]);

  const play = useCallback(() => {
    if (soundRef.current) {
      startPlayback();
      return;
    }
    setState(prev => ({ ...prev, isLoading: true }));
    const sound = new Sound(source, error => {
      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error: error.message ?? 'Failed to load audio' }));
        return;
      }
      soundRef.current = sound;
      setState(prev => ({ ...prev, isLoading: false, duration: sound.getDuration() }));
      startPlayback();
    });
  }, [source, startPlayback]);

  const toggle = useCallback(() => {
    if (soundRef.current?.isPlaying()) {
      pause();
    } else {
      play();
    }
  }, [pause, play]);

  const seek = useCallback((seconds: number) => {
    soundRef.current?.setCurrentTime(seconds);
    setState(prev => ({ ...prev, currentTime: seconds }));
  }, []);

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

  return { ...state, play, pause, stop, toggle, seek };
}
