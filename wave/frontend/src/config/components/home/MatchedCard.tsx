import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';
import { Routes } from '../../routes/registry';

export type MatchedCardProps = {
  title: string;
  count: number;
  route?: string;
  onPress?: () => void;
};

// A plain circle (not a progress ring - no percentage/fill math) showing a
// raw count, a small alert dot on its edge, and a "View All" action - e.g.
// "Jobs for you" on Home, matched against the user's profile.
export function MatchedCard({ title, count, route, onPress }: MatchedCardProps) {
  const handlePress = onPress ?? (() => Routes.deepLink(route));

  return (
    <Pressable onPress={handlePress} style={[styles.card, Themer.shadowWithBorder()]}>
      <View style={styles.ring}>
        <Text style={styles.count}>{count}</Text>
        <View style={styles.alertDot} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          Matched your profiler
        </Text>
        <Text style={styles.actionLabel}>View All</Text>
      </View>
    </Pressable>
  );
}

const RING_SIZE = 56;

const styles = StyleSheet.create({
  card: {
    width: 260,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.white,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1,
    borderColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.primary,
  },
  alertDot: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 4,
    backgroundColor: AppColors.secondary,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.neutral500,
  },
  subtitle: {
    fontSize: 12,
    color: AppColors.neutral300,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: AppColors.primary,
  },
});
