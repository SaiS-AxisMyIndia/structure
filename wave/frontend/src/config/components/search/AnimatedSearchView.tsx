import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { AppColors } from '../../theme/AppColors';
import { WebCenter } from '../layouts/Center';
import { ScrollController } from '../layouts/useScrollController';
import { SearchView } from '../form/SearchView';
import { SearchViewController } from '../form/SearchViewController';

export type AnimatedSearchViewProps = {
  scrollController: ScrollController;
  // Mobile-only affordance - the whole row slides off-screen on scroll
  // down and back on scroll-up (scrollController.translateY), reserving
  // scrollController.headerHeight of space via onHeaderLayout. Tablet/web
  // pass false to keep it a plain, always-visible in-flow header instead,
  // same as every *SearchPage's own renderBody already did before this was
  // pulled out into a shared component.
  hideOnScroll: boolean;
  hint: string;
  searchController: SearchViewController;
  onSubmit: (value: string) => void;
  onFilterPress: () => void;
};

export function AnimatedSearchView({
  scrollController,
  hideOnScroll,
  hint,
  searchController,
  onSubmit,
  onFilterPress,
}: AnimatedSearchViewProps) {
  const content = (
    <WebCenter style={styles.searchWrap}>
      <View style={styles.searchInputWrap}>
        <SearchView
          hint={hint}
          controller={searchController}
          onSubmit={onSubmit}
          onFilterPress={onFilterPress}
          showBack={scrollController.hidden}
        />
      </View>
    </WebCenter>
  );

  if (!hideOnScroll) {
    return <View style={styles.staticHeader}>{content}</View>;
  }

  return (
    <Animated.View
      onLayout={scrollController.onHeaderLayout}
      style={[styles.header, { transform: [{ translateY: scrollController.translateY }] }]}
    >
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: AppColors.white,
  },
  staticHeader: {},
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInputWrap: {
    flex: 1,
  },
});
