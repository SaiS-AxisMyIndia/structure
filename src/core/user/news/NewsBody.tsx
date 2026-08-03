import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { useNewsController } from './NewsController';

export function NewsBody() {
  const controller = useNewsController();
  const { summary, reload } = controller;

  return (
    <LoadingView
      controller={controller.loadingController}
      onRefresh={reload}
      body={
        summary ? (
          <>
            <Text style={styles.greeting}>{summary.greeting}</Text>
            <Text style={styles.stat}>Unread news: {summary.unreadNewsCount}</Text>
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
});
