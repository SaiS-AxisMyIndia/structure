import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SvgIcon } from '../images/SvgIcon';
import { SvgIcons } from '../images/svg_icons';
import { AppColors } from '../../theme/AppColors';
import { Routes } from '../../routes/registry';
import { SearchView } from '../form/SearchView';
import { SearchViewController } from '../form/SearchViewController';

export type SearchAppBarProps = {
  controller: SearchViewController;
  hint?: string;
  onBackPress?: () => void;
  onSubmit?: (value: string) => void;
  onFilterPress?: () => void;
};

// A TitleBar-shaped app bar (same height/padding/back-button convention) for
// screens that search instead of showing a static title - back arrow, a
// SearchView filling the middle, and a filter button on the right.
export function SearchAppBar({ controller, hint, onBackPress, onSubmit, onFilterPress }: SearchAppBarProps) {
  return (
    <View style={styles.container}>
      <Pressable onPress={onBackPress ?? (() => Routes.back())} hitSlop={8}>
        <SvgIcon icon={SvgIcons.back} size={22} />
      </Pressable>

      <View style={styles.searchWrap}>
        <SearchView controller={controller} hint={hint} onSubmit={onSubmit} />
      </View>

      <Pressable onPress={onFilterPress} hitSlop={8}>
        <SvgIcon icon={SvgIcons.filter} size={24} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: AppColors.white,
  },
  searchWrap: {
    flex: 1,
  },
});
