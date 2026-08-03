import React from 'react';
import { ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';

export const BottomType = {
  home: 'home',
  news: 'news',
  explore: 'explore',
  schemes: 'schemes',
  jobs: 'jobs',
} as const;

export type BottomType = (typeof BottomType)[keyof typeof BottomType];

export type BottomBarProps = {
  value: BottomType;
  onChange: (value: BottomType) => void;
};

const TABS: Array<{ type: BottomType; label: string; icon: ImageSourcePropType }> = [
  { type: BottomType.home, label: 'Home', icon: SvgIcons.home },
  { type: BottomType.news, label: 'News', icon: SvgIcons.news },
  { type: BottomType.explore, label: 'Explore', icon: SvgIcons.explore },
  { type: BottomType.schemes, label: 'Schemes', icon: SvgIcons.schemes },
  { type: BottomType.jobs, label: 'Jobs', icon: SvgIcons.jobs },
];

export function BottomBar({ value, onChange }: BottomBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const active = tab.type === value;
        const color = active ? AppColors.primary : AppColors.neutral400;

        return (
          <Pressable
            key={tab.type}
            onPress={() => onChange(tab.type)}
            hitSlop={8}
            style={styles.tab}
          >
            <SvgIcon icon={tab.icon} size={24} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: AppColors.white,
    paddingVertical: 8,
    ...Themer.bottomShadow(),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
