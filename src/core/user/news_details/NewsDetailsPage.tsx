import React from 'react';
import { useRoute } from '@react-navigation/native';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { TitleBar } from '../../../config/components/appbar/TitleBar';
import { ScreenView } from '../../../config/components/layouts/ScreenView';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { NewsDetailsHeader } from '../../../config/components/news_details/NewsDetailsHeader';
import { NewsContentBlockView } from '../../../config/components/news_details/NewsContentBlockView';
import { CompactNewsTile } from '../../../config/components/news/NewsTiles';
import { useNewsDetailsController } from './NewsDetailsController';
import { AppColors } from '../../../config/theme/AppColors';
import { ResponsiveView } from '../../../config/components/layouts/ResponsiveView';
import { MobileCenter, SizedCenterProps, TabletCenter } from '../../../config/components/layouts/Center';

type NewsDetailsQuery = {
  id?: string;
};

export function NewsDetailsPage() {
  const { params } = useRoute();
  const { id } = (params ?? {}) as NewsDetailsQuery;

  const controller = useNewsDetailsController(id ?? '');
  const { details, loading, reload, onSharePress } = controller;

  // Same content, capped to a different maxWidth per ResponsiveView tier -
  // mirrors the MobileCenter/TabletCenter split NotificationPage.tsx uses,
  // just factored out so the header/blocks/related-section aren't duplicated
  // per tier.
  const renderBody = (CenterView: (props: SizedCenterProps) => React.ReactElement) => (
    <LoadingView
      controller={controller.loadingController}
      onRefresh={reload}
      body={
        details ? (
          <FlatList
            data={details.blocks}
            keyExtractor={block => block.id}
            onRefresh={reload}
            refreshing={loading}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <CenterView>
                <NewsContentBlockView block={item} />
              </CenterView>
            )}
            ListHeaderComponent={
              <CenterView>
                <NewsDetailsHeader
                  source={details.source}
                  sourceLogo={details.sourceLogo}
                  time={details.time}
                  title={details.title}
                  image={details.image}
                  views={details.views}
                  onSharePress={onSharePress}
                />
              </CenterView>
            }
            ListFooterComponent={
              details.related.length > 0 ? (
                <CenterView>
                  <View style={styles.relatedSection}>
                    <Text style={styles.relatedTitle}>More from {details.source}</Text>
                    <FlatList
                      data={details.related}
                      keyExtractor={item => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.relatedList}
                      renderItem={({ item }) => (
                        <CompactNewsTile {...item} maxWidth={320} />
                      )}
                    />
                  </View>
                </CenterView>
              ) : null
            }
          />
        ) : null
      }
    />
  );

  return (
    <ScreenView
      appbar={<TitleBar title={details?.source ?? "News"} />}
      body={<ResponsiveView mobile={renderBody(MobileCenter)} tablet={renderBody(TabletCenter)} />}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingBottom: 24,
  },
  relatedSection: {
    marginTop: 12,
  },
  relatedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.neutral500,
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  relatedList: {
    paddingHorizontal: 8,
  },
});
