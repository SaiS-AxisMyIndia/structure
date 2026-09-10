import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ImageLoader } from '../images/ImageLoader';
import { Routes } from '../../routes/registry';
import { YouMightLikeItem } from './YouMightLikeModel';

const ASPECT_RATIO = 3 / 4;

export type YouMightLikeTileProps = {
  item: YouMightLikeItem;
};

// A single pre-designed image (icon/title/button all baked into the asset)
// rather than a composed card - same convention as BannerNotificationTile's
// image.
export function YouMightLikeTile({ item }: YouMightLikeTileProps) {
  return (
    <Pressable onPress={() => Routes.deepLink(item.route)}>
      <ImageLoader
        source={{ uri: item.image }}
        style={styles.card}
        aspectRatio={ASPECT_RATIO}
        borderRadius={0}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 140,
  },
});
