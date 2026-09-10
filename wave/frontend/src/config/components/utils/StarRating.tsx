import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';

const STAR_COUNT = 5;

export type StarRatingProps = {
  rating: number;
  // Icon size of each star glyph - ProductCard/ServiceTile's grid/list
  // rows use the 14 default, ProductDetailsPage's larger header row passes
  // 16.
  size?: number;
};

export function StarRating({ rating, size = 14 }: StarRatingProps) {
  const filled = Math.round(rating);
  return (
    <View style={styles.stars}>
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <SvgIcon
          key={index}
          icon={index < filled ? SvgIcons.starFilled : SvgIcons.starOutline}
          size={size}
          color={AppColors.copper}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
});
