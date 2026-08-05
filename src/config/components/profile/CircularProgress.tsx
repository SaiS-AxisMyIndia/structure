import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { AppColors } from '../../theme/AppColors';

export type CircularProgressProps = {
  // 0-100
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
};

export function CircularProgress({
  percentage,
  size = 56,
  strokeWidth = 5,
  color = AppColors.primary,
  trackColor = AppColors.neutral,
}: CircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle cx={center} cy={center} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="none"
          // Rotate so progress starts at 12 o'clock instead of the default 3 o'clock.
          rotation={-90}
          origin={`${center}, ${center}`}
        />
      </Svg>
      <Text style={[styles.label, { color }]}>{`${Math.round(clamped)}%`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    fontSize: 13,
    fontWeight: '700',
  },
});
