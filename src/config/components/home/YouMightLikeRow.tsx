import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { ImageLoader } from '../images/ImageLoader';
import { Routes } from '../../routes/registry';
import { YouMightLikeItem } from '../../../core/user/home/HomeRepo';

const ASPECT_RATIO = 3 / 4;

export type YouMightLikeRowProps = {
  items: YouMightLikeItem[];
};

// Each item is a single pre-designed image (icon/title/button all baked
// into the asset) rather than a composed card - same convention as
// BannerNotificationTile's image, just laid out as a horizontal row.
export function YouMightLikeRow({ items }: YouMightLikeRowProps) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {items.map(item => (
        <Pressable key={item.id} onPress={() => Routes.deepLink(item.route)}>
          <ImageLoader
            source={{ uri: item.image }}
            style={styles.card}
            aspectRatio={ASPECT_RATIO}
            borderRadius={12}
          />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
  },
  card: {
    width: 140,
  },
});
