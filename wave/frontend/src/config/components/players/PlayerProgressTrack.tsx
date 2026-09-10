import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';

export type PlayerProgressTrackProps = {
  progress: number;
  onSeekRatio: (ratio: number) => void;
};

export function PlayerProgressTrack({ progress, onSeekRatio }: PlayerProgressTrackProps) {
  const trackWidthRef = useRef(0);
  const committedProgressRef = useRef(progress);
  committedProgressRef.current = progress;
  const dragStartProgressRef = useRef(0);
  // The PanResponder below is only ever built once (see the `useRef(
  // PanResponder.create(...))` below) - its handlers permanently close over
  // whatever `onSeekRatio` was at that first render. For the audio player,
  // that's before the sound has loaded (duration still 0), so a frozen
  // `onSeekRatio` would seek to `ratio * 0` forever, i.e. always back to 0 -
  // the thumb still drags visually (that reads live refs), but playback
  // never actually moves. Routing the call through a ref kept current every
  // render fixes that without needing to rebuild the PanResponder itself.
  const onSeekRatioRef = useRef(onSeekRatio);
  onSeekRatioRef.current = onSeekRatio;

  const [isDragging, setIsDragging] = useState(false);
  const [dragProgress, setDragProgress] = useState(0);
  const displayProgress = isDragging ? dragProgress : progress;

  const applyDragDelta = (dx: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) {return;}
    const ratio = Math.min(1, Math.max(0, dragStartProgressRef.current + dx / width));
    setDragProgress(ratio);
    onSeekRatioRef.current(ratio);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartProgressRef.current = committedProgressRef.current;
        setDragProgress(committedProgressRef.current);
        setIsDragging(true);
      },
      onPanResponderMove: (_evt, gestureState) => {
        applyDragDelta(gestureState.dx);
      },
      onPanResponderRelease: () => setIsDragging(false),
      onPanResponderTerminate: () => setIsDragging(false),
    }),
  ).current;

  return (
    <View
      style={styles.trackTouchArea}
      onLayout={e => {
        trackWidthRef.current = e.nativeEvent.layout.width;
      }}
      {...panResponder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${displayProgress * 100}%` }]} />
        <View style={[styles.trackThumb, { left: `${displayProgress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  trackTouchArea: {
    justifyContent: 'center',
    paddingVertical: 10,
  },
  track: {
    height: 3,
    backgroundColor: AppColors.neutral200,
    borderRadius: 2,
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: AppColors.primary,
    borderRadius: 2,
  },
  trackThumb: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AppColors.primary,
    marginLeft: -5,
    top: -3.5,
  },
});
