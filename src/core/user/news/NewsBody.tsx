import React from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { useNewsController } from './NewsController';
import { renderNewsTile } from '../../../config/components/news/NewsTiles';
import { Chip } from '../../../config/components/buttons/Chip';
import { AppConstants } from '../../../config/constants/AppConstants';
import { ResponsiveView } from '../../../config/components/layouts/ResponsiveView';
import { MobileCenter, SizedCenterProps, TabletCenter, WebCenter } from '../../../config/components/layouts/Center';

export function NewsBody() {
  const controller = useNewsController();
  const { news, loading, reload, selectedCategory, onCategoryChange } = controller;

  // Same content, capped to a different maxWidth per ResponsiveView tier -
  // mirrors the MobileCenter/TabletCenter split NotificationPage.tsx and
  // NewsDetailsPage.tsx use, just factored out so the chip row/list aren't
  // duplicated per tier.
  const renderBody = (CenterView: (props: SizedCenterProps) => React.ReactElement) => (
    <View style={styles.container}>
      {/* Kept outside LoadingView so the chip row stays put through
          loading/error states instead of disappearing along with `body`. */}
      <CenterView>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={styles.chipRow}
        >
          {AppConstants.newsCategories.map(category => (
            <Chip
              key={category}
              label={category}
              selected={category === selectedCategory}
              onPress={() => onCategoryChange(category)}
            />
          ))}
        </ScrollView>
      </CenterView>
      <LoadingView
        controller={controller.loadingController}
        onRefresh={reload}
        body={
          <FlatList
            data={news}
            keyExtractor={item => item.id}
            onRefresh={reload}
            refreshing={loading}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => <CenterView>{renderNewsTile(item)}</CenterView>}
          />
        }
      />
    </View>
  );

  return (
    <ResponsiveView
      mobile={renderBody(MobileCenter)}
      tablet={renderBody(TabletCenter)}
      web={renderBody(WebCenter)}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingVertical: 8,
  },
  // ScrollView's own default style has flexGrow/flexShrink: 1 baked in, so
  // without this override it stretches to share leftover vertical space
  // with LoadingView below it instead of hugging the chips' own height.
  chipScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
