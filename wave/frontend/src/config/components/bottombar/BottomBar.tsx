import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AppColors } from '../../theme/AppColors';
import { Themer } from '../../theme/Themer';

export const BottomType = {
  home: 'home',
  subscription: 'subscription',
  search: 'search',
  cart: 'cart',
  profile: 'profile',
} as const;

export type BottomType = (typeof BottomType)[keyof typeof BottomType];

export type BottomBarProps = {
  value: BottomType;
  onChange: (value: BottomType) => void;
};

// Exported so other nav UI for the same 5 destinations (e.g. MainBar's web
// top nav) can share this one label/type list instead of redeclaring it.
export const TABS: Array<{ type: BottomType; label: string; icon: React.ComponentType<SvgProps> }> = [
  { type: BottomType.home, label: 'Home', icon: SvgIcons.home },
  { type: BottomType.subscription, label: 'Subscription', icon: SvgIcons.subscription },
  { type: BottomType.search, label: 'Search', icon: SvgIcons.search },
  { type: BottomType.cart, label: 'Cart', icon: SvgIcons.cart },
  { type: BottomType.profile, label: 'Profile', icon: SvgIcons.profile },
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
