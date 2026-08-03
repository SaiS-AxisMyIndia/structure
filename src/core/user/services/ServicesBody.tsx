import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { useServicesController } from './ServicesController';

export function ServicesBody() {
  const controller = useServicesController();
  const { summary, reload } = controller;

  return (
    <LoadingView
      controller={controller.loadingController}
      onRefresh={reload}
      body={
        summary ? (
          <>
            <Text style={styles.greeting}>{summary.greeting}</Text>
            <Text style={styles.stat}>Active services: {summary.activeServicesCount}</Text>
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
