import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { useJobsController } from './JobsController';

export function JobsBody() {
  const controller = useJobsController();
  const { jobs, loading, reload } = controller;

  return (
    <LoadingView
      controller={controller.loadingController}
      onRefresh={reload}
      body={
        <FlatList
          data={jobs}
          keyExtractor={job => job.id}
          onRefresh={reload}
          refreshing={loading}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.status}>{item.status}</Text>
            </View>
          )}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDDDDD',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  error: {
    color: '#D93025',
    paddingHorizontal: 16,
  },
});
