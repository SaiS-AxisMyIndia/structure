import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { useSurveySController } from './SurveySController';

export function SurveySBody() {
  const controller = useSurveySController();
  const { assignments, loading, reload } = controller;

  return (
    <LoadingView
      controller={controller.loadingController}
      onRefresh={reload}
      body={
        <FlatList
          data={assignments}
          keyExtractor={assignment => assignment.id}
          onRefresh={reload}
          refreshing={loading}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={styles.title}>{item.siteName}</Text>
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
