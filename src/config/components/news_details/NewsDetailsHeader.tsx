import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { ImageLoader } from '../images/ImageLoader';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { formatViews } from '../news/NewsTiles';
import { DateFormatter } from '../../utils/DateFormatter';

export type NewsDetailsHeaderProps = {
  source: string;
  sourceLogo: string;
  time: string;
  title: string;
  image: string;
  views: number;
  aspectRatio?: number;
  onSharePress?: () => void;
};

export function NewsDetailsHeader({
  source,
  sourceLogo,
  time,
  title,
  image,
  views,
  aspectRatio = 16 / 9,
  onSharePress,
}: NewsDetailsHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <ImageLoader source={{ uri: sourceLogo }} style={styles.logo} borderRadius={16} />
        <Text style={styles.source} numberOfLines={1}>
          {source}
        </Text>
        <Text style={styles.time}>{DateFormatter.smart(time)}</Text>
      </View>
      <ImageLoader source={{ uri: image }} style={styles.image} aspectRatio={aspectRatio} borderRadius={10} />
      <Text style={styles.title}>{title}</Text>
      <View style={styles.footer}>
        <Pressable onPress={onSharePress} hitSlop={8}>
          <SvgIcon icon={SvgIcons.share} size={20} />
        </Pressable>
        <View style={styles.viewsRow}>
          <SvgIcon icon={SvgIcons.eye} size={18} />
          <Text style={styles.viewsText}>{formatViews(views)} Views</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logo: {
    width: 32,
    height: 32,
  },
  source: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  time: {
    fontSize: 14,
    color: AppColors.neutral300,
  },
  image: {
    width: '100%',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.neutral500,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.neutral100,
  },
  viewsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewsText: {
    fontSize: 14,
    color: AppColors.neutral400,
  },
});
