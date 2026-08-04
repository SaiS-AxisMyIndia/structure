import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { useHomeController } from './HomeController';
import { Routes } from '../../../config/routes/registry';
import { ElevatedButton } from '../../../config/components/buttons/ElevatedButton';
import { AppConstants, WebviewTag } from '../../../config/constants/AppConstants';
import { BorderButton } from '../../../config/components/buttons/BorderButton';

export function HomeBody() {
  const controller = useHomeController();
  const { summary, reload } = controller;

  return (
    <LoadingView
      controller={controller.loadingController}
      onRefresh={reload}
      body={
        summary ? (
          <>
            <Text style={styles.greeting}>{summary.greeting}</Text>
            <Text style={styles.stat}>Active jobs: {summary.activeJobsCount}</Text>

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
          </>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  stat: {
    fontSize: 14,
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
});
