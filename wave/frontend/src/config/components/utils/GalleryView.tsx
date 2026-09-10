import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { ImageLoader } from '../images/ImageLoader';

export type GalleryViewProps = {
  images: string[];
  // Space between photos - defaults to 0 (the original flush filmstrip),
  // a caller wanting visible separation (e.g. SkillDetailsPage) passes 8.
  gap?: number;
  // Per-photo aspect ratio - defaults to 4/5 (portrait), a caller can pass
  // e.g. 16/9 for a wider crop instead.
  aspectRatio?: number;
};

const GALLERY_LIMIT = 4;

// A details-screen card - "Gallery" title + up to GALLERY_LIMIT photos
// stacked full-width (a filmstrip, not a grid). Always slices to
// GALLERY_LIMIT regardless of how many `images` the caller passes, so
// this never silently grows into a long scroll - a details page just
// wants a handful of highlight photos here, not the whole album.
export function GalleryView({ images, gap = 0, aspectRatio = 4 / 5 }: GalleryViewProps) {
  const photos = images.slice(0, GALLERY_LIMIT);
  if (photos.length === 0) {return null;}

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Gallery</Text>
      <View style={{ gap }}>
        {photos.map((uri, index) => (
          <ImageLoader
            key={`${uri}-${index}`}
            source={{ uri }}
            style={styles.image}
            aspectRatio={aspectRatio}
            borderRadius={0}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: AppColors.neutral500,
    paddingBottom: 12,
  },
  image: {
    width: '100%',
  },
});
