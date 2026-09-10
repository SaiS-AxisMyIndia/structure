import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { Routes } from '../../routes/registry';

export type SectionFooterProps = {
  // The left-side caption content, e.g. a bold count + label ("30,000
  // schemes available") or a plain string ("Live News") - left as
  // children so callers compose their own text styling instead of this
  // component guessing at a count/label split that doesn't always apply.
  children: React.ReactNode;
  moreLabel?: string;
  route?: string;
  onMorePress?: () => void;
};

// A stat/caption pill on the left (trending icon + children) and a "More"
// action on the right - reused by CategoryGridCard's Schemes/Services/Jobs
// cards and, standalone, under Home's Trending News list.
export function SectionFooter({ children, moreLabel = 'More', route, onMorePress }: SectionFooterProps) {
  const handleMorePress = onMorePress ?? (() => Routes.deepLink(route));

  return (
    <View style={styles.row}>
      <View style={styles.captionPill}>
        <SvgIcon icon={SvgIcons.trending} size={16} color={AppColors.tertiary} />
        {children}
      </View>
      <Pressable onPress={handleMorePress} style={styles.moreButton}>
        <Text style={styles.moreLabel}>{moreLabel}</Text>
        <SvgIcon icon={SvgIcons.arrowRight} size={14} color={AppColors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  captionPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AppColors.tertiary100,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: AppColors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  moreLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
});
