import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ImageLoader } from '../images/ImageLoader';
import { Routes } from '../../routes/registry';
import { BannerSliderItem } from './BannerSliderModel';

const ASPECT_RATIO = 7 / 2;

export type BannerSliderTileProps = {
  item: BannerSliderItem;
};

// A single pre-designed banner image - same convention as YouMightLikeTile's
// image (icon/title/button all baked into the asset), just wider/shorter and
// with no title rendered alongside it.
export function BannerSliderTile({ item }: BannerSliderTileProps) {
  return (
    <Pressable onPress={() => Routes.deepLink(item.route)}>
      <ImageLoader
        source={{ uri: item.image }}
        style={styles.card}
        aspectRatio={ASPECT_RATIO}
        maxWidth={300}
        borderRadius={0}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
  },
});
