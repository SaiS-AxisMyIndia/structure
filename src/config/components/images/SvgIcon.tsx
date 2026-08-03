import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { AppColors } from '../../theme/AppColors';

export type SvgIconProps = {
  icon: ImageSourcePropType;
  size?: number;
  color?: (typeof AppColors)[keyof typeof AppColors];
};

export function SvgIcon({ icon, size = 24, color }: SvgIconProps) {
  const { uri } = Image.resolveAssetSource(icon);
  return <SvgUri uri={uri} width={size} height={size} color={color} />;
}