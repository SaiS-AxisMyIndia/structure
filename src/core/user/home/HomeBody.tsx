import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { useHomeController } from './HomeController';
import { Routes } from '../../../config/routes/registry';
import { ElevatedButton } from '../../../config/components/buttons/ElevatedButton';
import { AppConstants, WebviewTag } from '../../../config/constants/AppConstants';
import { BorderButton } from '../../../config/components/buttons/BorderButton';
import { renderProfileProgressCard } from '../../../config/components/profile/ProfileProgressCard';
import { CompactNewsTile } from '../../../config/components/news/NewsTiles';
import { AppColors } from '../../../config/theme/AppColors';

export function HomeBody() {
  const controller = useHomeController();
  const { summary, inactiveProfileCards, onCardPress, preferredNews, reload } = controller;

  return (
    <LoadingView
      controller={controller.loadingController}
      onRefresh={reload}
      body={
        summary ? (
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.greeting}>{summary.greeting}</Text>
            <Text style={styles.stat}>Active jobs: {summary.activeJobsCount}</Text>

            {inactiveProfileCards.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.progressRow}
              >
                {inactiveProfileCards.map(card => (
                  <View key={card.title}>
                    {renderProfileProgressCard(card, () => onCardPress(card))}
                  </View>
                ))}
              </ScrollView>
            ) : null}

            {preferredNews.length > 0 ? (
              <View style={styles.relatedSection}>
                <Text style={styles.relatedTitle}>Trending News</Text>
                {preferredNews.map(item => (
                  <CompactNewsTile key={item.id} {...item} />
                ))}
              </View>
            ) : null}

            <View style={styles.testSection}>
              <Text style={styles.testLabel}>Test webview tags</Text>
              {(['policy', 'terms', 'udan'] as WebviewTag[]).map(tag => (
                <ElevatedButton
                  key={tag}
                  label={tag}
                  onPress={() => Routes.common.webview.navigate({ tag })}
                />
              ))}

              <Text style={styles.testLabel}>Test webview url</Text>
              <ElevatedButton
                label="Open Example"
                onPress={() =>
                  Routes.common.webview.navigate({
                    url: AppConstants.urls.example,
                  })
                }
              />
              <BorderButton
                label="Survey"
                onPress={() =>
                  Routes.common.webview.navigate({
                    url: AppConstants.urls.survey,
                  })
                }
              />
            </View>
          </ScrollView>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  stat: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  testSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    gap: 12,
  },
  testLabel: {
    fontSize: 14,
    fontWeight: '600',
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
});
