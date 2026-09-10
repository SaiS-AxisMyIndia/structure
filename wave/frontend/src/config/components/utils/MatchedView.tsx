import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';

// Native aspect ratio of ill_wave.svg (402x184) - scaled to whatever width
// this view actually renders at (same onLayout + explicit width/height
// technique NeedsPromoCard.tsx uses for its own background illustration,
// since RN can't size an SVG by percentage the way a plain View can).
const WAVE_WIDTH = 402;
const WAVE_HEIGHT = 184;

export type MatchedViewProps<T> = {
  title?: string;
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  onViewAllPress?: () => void;
};

// Generic "N things matched to you" card - schemes today (SchemesPage), but
// domain-agnostic (jobs/services carry the same "Matched" tag convention -
// see JobsRepo/SchemesRepo) so any list of matched items can reuse this
// rather than each screen rolling its own tertiary100 + wave-illustration
// card. Hides itself entirely when `items` is empty - "View All" always
// shows otherwise, since it always leads to the real matched search screen
// regardless of how many items this preview happens to hold.
export function MatchedView<T>({ title = 'Matches you', items, keyExtractor, renderItem, onViewAllPress }: MatchedViewProps<T>) {
  const [cardWidth, setCardWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setCardWidth(e.nativeEvent.layout.width);

  if (items.length === 0) {return null;}

  return (
    <View style={[styles.card]} onLayout={onLayout}>
      {cardWidth > 0 && (
        <View style={styles.waveWrap} pointerEvents="none">
          <SvgIcon icon={SvgIcons.illWave} width={cardWidth} height={cardWidth * (WAVE_HEIGHT / WAVE_WIDTH)} />
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.list}>
          {items.map(item => (
            <View key={keyExtractor(item)}>{renderItem(item)}</View>
          ))}
        </View>

        <Pressable onPress={onViewAllPress} style={styles.viewAllButton} hitSlop={8}>
          <Text style={styles.viewAllLabel}>View All</Text>
          <SvgIcon icon={SvgIcons.arrowRight} size={16} color={AppColors.tertiary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.tertiary100,
  },
  waveWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.black,
  },
  list: {
    gap: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: AppColors.tertiary,
    backgroundColor: AppColors.white,
  },
  viewAllLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.tertiary,
  },
});
