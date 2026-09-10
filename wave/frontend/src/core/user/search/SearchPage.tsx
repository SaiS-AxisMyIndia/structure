import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { TabScreenView } from '../../../config/components/layouts/TabScreenView';
import { userTabConfig } from '../../../config/components/bottombar/userTabConfig';
import { BottomType } from '../../../config/components/bottombar/BottomBar';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { ResponsiveView } from '../../../config/components/layouts/ResponsiveView';
import { MobileCenter, SizedCenterProps, TabletCenter, WebCenter } from '../../../config/components/layouts/Center';
import { SearchView } from '../../../config/components/form/SearchView';
import { EmptyListView } from '../../../config/components/layouts/EmptyListView';
import { AppColors } from '../../../config/theme/AppColors';
import { useSearchController } from './SearchController';
import { SearchResultItem } from './SearchRepo';

function ResultRow({ item }: { item: SearchResultItem }) {
  return (
    <Pressable style={styles.row}>
      <Image source={{ uri: item.imageUrl }} style={styles.rowImage} />
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>{item.subtitle}</Text>
      </View>
    </Pressable>
  );
}

// No ScreenView here - same convention as HomePage.tsx's HomeBody (see its
// own note): BottomBarView supplies MainBar/BottomBar on mobile/tablet,
// TabScreenView's web branch supplies MainBar via ScreenView on web.
export function SearchBody() {
  const controller = useSearchController();
  const { searchView, loadingController, results, trending, hasQuery } = controller;
  const listData = hasQuery ? results : trending;

  const renderBody = (CenterView: (props: SizedCenterProps) => React.ReactElement) => (
    <LoadingView
      controller={loadingController}
      body={
        <CenterView style={styles.container}>
          <View style={styles.searchWrap}>
            <SearchView controller={searchView} hint="Search products & services" />
          </View>
          {!hasQuery && trending.length > 0 && <Text style={styles.sectionLabel}>Trending</Text>}
          {hasQuery && results.length === 0 ? (
            <EmptyListView title="No results" description={`Nothing matched "${searchView.value}"`} />
          ) : (
            <FlatList
              data={listData}
              keyExtractor={item => item.id}
              renderItem={({ item }) => <ResultRow item={item} />}
              contentContainerStyle={styles.list}
            />
          )}
        </CenterView>
      }
    />
  );

  function mobile() {
    return renderBody(MobileCenter);
  }

  function tablet() {
    return renderBody(TabletCenter);
  }

  function web() {
    return renderBody(WebCenter);
  }

  return <ResponsiveView mobile={mobile()} tablet={tablet()} web={web()} />;
}

export function SearchPage() {
  return <TabScreenView config={userTabConfig} tab={BottomType.search} body={<SearchBody />} isHome={false} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  searchWrap: {
    paddingHorizontal: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.neutral500,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: AppColors.neutral100,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.neutral500,
  },
  rowSubtitle: {
    fontSize: 12,
    color: AppColors.neutral400,
    marginTop: 2,
  },
});
