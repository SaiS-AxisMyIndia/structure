import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';

export type ToggleButtonProps = {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  width?: number;
};

// ic_toggle_on/off.svg are pre-colored pill graphics (track + thumb baked
// into one flat-fill icon per state), not a silhouette meant for
// SvgIcon's color/gradient masking - rendered raw, sized to their own
// intrinsic 32:20 aspect ratio so the pill doesn't stretch.
const ASPECT_RATIO = 20 / 32;

export function ToggleButton({ value, onValueChange, disabled, width = 44 }: ToggleButtonProps) {
  const height = width * ASPECT_RATIO;
  // 0 = off, 1 = on - drives both icons' crossfade and a small squeeze/pop,
  // so flipping the switch reads as a deliberate action instead of an
  // instant icon swap. Same Animated.Value + useRef shape as
  // SchemeFooterBar's slide animation elsewhere in this app.
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      friction: 6,
      tension: 60,
    }).start();
  }, [value, progress]);

  const scale = progress.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.85, 1] });
  const onOpacity = progress;
  const offOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
      style={disabled && styles.disabled}
    >
      <Animated.View style={{ width, height, transform: [{ scale }] }}>
        <Animated.View style={[styles.layer, { opacity: onOpacity }]}>
          <SvgIcon icon={SvgIcons.toggleOn} width={width} height={height} />
        </Animated.View>
        <Animated.View style={[styles.layer, { opacity: offOpacity }]}>
          <SvgIcon icon={SvgIcons.toggleOff} width={width} height={height} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
  },
  disabled: {
    opacity: 0.5,
  },
});
