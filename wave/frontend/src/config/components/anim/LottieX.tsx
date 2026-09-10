import React from 'react';
import LottieView, { AnimationObject } from 'lottie-react-native';

export type LottieXProps = {
  // The actual animation object, e.g. `Anims.needs` (see lottie_anims.ts) -
  // same convention SvgIcon's own `icon` prop uses for SvgIcons.whatever.
  name: AnimationObject;
  size?: number;
  width?: number;
  height?: number;
  maxWidth?: number;
  maxHeight?: number;
};

export function LottieX({ name, size = 100, width, height, maxWidth, maxHeight }: LottieXProps) {
  const w = width ?? size;
  const h = height ?? size;

  return (
    <LottieView
      source={name}
      autoPlay
      loop
      style={{
        width: w,
        height: h,
        maxWidth,
        maxHeight,
      }}
    />
  );
}
