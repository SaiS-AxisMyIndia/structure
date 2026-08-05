import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { useNewsController } from './NewsController';
import { renderNewsTile } from '../../../config/components/news/NewsTiles';

export function NewsBody() {
  const controller = useNewsController();
  const { news, loading, reload } = controller;

  return (
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
          renderItem={({ item }) => renderNewsTile(item)}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
});
