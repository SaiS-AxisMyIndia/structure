import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { TitleBar } from '../../../config/components/appbar/TitleBar';
import { ScreenView } from '../../../config/components/layouts/ScreenView';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { Routes } from '../../../config/routes/registry';
import { useProfileController } from './ProfileController';

export function ProfilePage() {
  const controller = useProfileController();
  const { profile, reload } = controller;

  return (
    <ScreenView
      appbar={<TitleBar title="Profile & Menu" onBackPress={() => Routes.user.home.navigate()} />}
      body={
        <LoadingView
          controller={controller.loadingController}
          onRefresh={reload}
          body={
            profile ? (
              <>
                <Text style={styles.name}>{profile.name}</Text>
                <Text style={styles.detail}>{profile.email}</Text>
                <Text style={styles.detail}>{profile.phone}</Text>
              </>
            ) : null
          }
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  name: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  detail: {
    fontSize: 14,
    opacity: 0.7,
    paddingHorizontal: 16,
    marginTop: 4,
  },
});
