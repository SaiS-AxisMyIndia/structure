import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { Routes } from '../../routes/registry';
import { RemoteIcon } from '../images/RemoteIcon';
import { CategoryGridItem } from './CategoryGridModel';
import { SectionFooter } from './SectionFooter';

const ICON_CIRCLE_SIZE = 48;
const ICON_SIZE = 24;

function CategoryGridTile({ item, onPress }: { item: CategoryGridItem; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.tile}>
      <View style={styles.iconCircle}>
        <LinearGradient
          colors={Themer.primaryGradient.colors}
          start={Themer.primaryGradient.start}
          end={Themer.primaryGradient.end}
          locations={Themer.primaryGradient.locations}
          style={StyleSheet.absoluteFill}
        />
        <RemoteIcon uri={item.iconUrl} size={ICON_SIZE} color={AppColors.white} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {item.label}
      </Text>
    </Pressable>
  );
}

export type CategoryGridCardProps = {
  items: CategoryGridItem[];
  count: number;
  countLabel: string;
  route?: string;
  onItemPress?: (item: CategoryGridItem) => void;
  onMorePress?: () => void;
};

// Transparent, no card background/border - just a 3-column grid of
// gradient-circle icons/labels, then a SectionFooter ("N <countLabel>" +
// "More") - e.g. Home's Schemes/Services/Jobs cards, all built from this
// same component with different data.
export function CategoryGridCard({ items, count, countLabel, route, onItemPress, onMorePress }: CategoryGridCardProps) {
  if (items.length === 0) {return null;}

  return (
    <View style={styles.card}>
      <View style={styles.grid}>
        {items.map(item => (
          <CategoryGridTile
            key={item.id}
            item={item}
            onPress={() => (onItemPress ? onItemPress(item) : Routes.deepLink(item.route))}
          />
        ))}
      </View>
      <SectionFooter route={route} onMorePress={onMorePress}>
        <Text style={styles.countText}>
          <Text style={styles.countNumber}>{count.toLocaleString()}</Text> {countLabel}
        </Text>
      </SectionFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 20,
  },
  tile: {
    // 3 columns - each tile claims a third of the grid's width, minus the
    // wrap gaps either side.
    width: '33.33%',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.neutral500,
    textAlign: 'center',
  },
  countText: {
    fontSize: 13,
    color: AppColors.neutral500,
  },
  countNumber: {
    fontWeight: '700',
    color: AppColors.secondary,
  },
});
