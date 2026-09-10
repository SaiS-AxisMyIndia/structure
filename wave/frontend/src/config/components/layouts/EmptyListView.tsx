import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { ElevatedButton } from '../buttons/ElevatedButton';

// Same illustration for every list screen (Schemes/Services/Jobs/...) - a
// generic "nothing here" graphic, not per-feature like
// SvgIcons.illEmptyNotifications. It's a raster asset (not wired into the
// svg_icons.ts pipeline, which is SVG-only), so it's require()'d directly
// and rendered via plain <Image>, same as ImageLoader falls back to for any
// local (non-remote) source.
const NOT_FOUND_ILLUSTRATION = require('../../../../assets/icons/ill_not_found.png');

export type EmptyListViewProps = {
  title: string;
  description: string;
  // Optional - e.g. clearing a category filter (Home -> Schemes?category=x
  // with no matches) back to the unfiltered list. Omitted, this is just a
  // plain "nothing here yet" state with no action.
  onResetPress?: () => void;
  resetLabel?: string;
};

// Drop-in `body` for LoadingView (see SchemesPage/ServicesPage/JobsPage) -
// or a FlatList's ListEmptyComponent (see NotificationPage, the one other
// empty-state precedent this mirrors) - for whenever a list screen's data
// loaded successfully but came back empty.
export function EmptyListView({ title, description, onResetPress, resetLabel = 'Reset' }: EmptyListViewProps) {
  return (
    <View style={styles.container}>
      <Image source={NOT_FOUND_ILLUSTRATION} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {onResetPress && (
        <View style={styles.resetButtonWrap}>
          <ElevatedButton label={resetLabel} onPress={onResetPress} paddingHorizontal={24} paddingVertical={12} fontSize={14} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 4,
  },
  image: {
    width: 200,
    height: 175,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.neutral500,
    marginTop: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.neutral400,
    textAlign: 'center',
  },
  resetButtonWrap: {
    marginTop: 16,
  },
});
