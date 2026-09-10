import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { ImageLoader } from '../images/ImageLoader';
import { SvgIcon } from '../images/SvgIcon';
import { Routes } from '../../routes/registry';
import { AmiForYouItem, AmiForYouThumbnail } from './AmiForYouModel';

const THUMB_SIZE = 64;

function AmiForYouThumb({ thumbnail }: { thumbnail: AmiForYouThumbnail }) {
  if (thumbnail.kind === 'illustration') {
    return <SvgIcon icon={thumbnail.illustration} size={THUMB_SIZE} />;
  }
  return <ImageLoader source={{ uri: thumbnail.image }} style={styles.thumb} borderRadius={0} aspectRatio={1} />;
}

export type AmiForYouTileProps = {
  item: AmiForYouItem;
  onPress?: () => void;
};

// A bordered card - title/description/time on the left, an illustration
// thumbnail on the right - e.g. "Ayushman Bharat - Hospitals" under Home's
// "AMI for you" section.
export function AmiForYouTile({ item, onPress }: AmiForYouTileProps) {
  const handlePress = onPress ?? (() => Routes.deepLink(item.route));

  return (
    <Pressable onPress={handlePress} style={styles.card}>
      <View style={styles.textCol}>
        <View style={styles.topGroup}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <Text style={styles.time}>{item.time}</Text>
      </View>
      <AmiForYouThumb thumbnail={item.thumbnail} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    flexDirection: 'row',
    // Default (stretch), not 'flex-start' - textCol needs to stretch to
    // the thumbnail's height so `time`'s marginTop: 'auto' below has room
    // to push it down to the bottom.
    gap: 10,
    backgroundColor: AppColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: AppColors.neutral100,
    padding: 12,
  },
  textCol: {
    flex: 1,
  },
  topGroup: {
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  description: {
    fontSize: 12,
    color: AppColors.neutral400,
  },
  time: {
    fontSize: 11,
    color: AppColors.neutral300,
    // Auto margin eats all remaining space in textCol, pinning this to the
    // bottom regardless of how tall title/description end up - no fixed
    // gap to keep in sync with description's line count.
    marginTop: 'auto',
  },
  thumb: {
    width: 64,
    height: 64,
  },
});
