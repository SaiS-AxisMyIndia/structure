import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { TitleBar } from '../../../config/components/appbar/TitleBar';
import { ScreenView } from '../../../config/components/layouts/ScreenView';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { Routes } from '../../../config/routes/registry';
import { AppConstants } from '../../../config/constants/AppConstants';
import { useProfileController } from './ProfileController';
import { renderProfileProgressCard } from '../../../config/components/profile/ProfileProgressCard';
import { ProfileFeaturesCard } from '../../../config/components/profile/ProfileFeaturesCard';
import { ProfileFeatureItem } from '../../../config/components/profile/ProfileFeaturesModel';
import { SvgIcons } from '../../../config/components/images/svg_icons';

const FEATURES: ProfileFeatureItem[] = [
  { title: 'My Surveys', icon: SvgIcons.survey },
  { title: 'My Schemes', icon: SvgIcons.schemes },
  { title: 'My Services', icon: SvgIcons.services },
  { title: 'My Jobs', icon: SvgIcons.jobs },
];

function onFeaturePress(item: ProfileFeatureItem) {
  switch (item.title) {
    case 'My Surveys':
      return Routes.common.webview.navigate({ url: AppConstants.urls.survey });
    case 'My Schemes':
      return Routes.user.schemes.navigate();
    case 'My Services':
      return Routes.user.services.navigate();
    case 'My Jobs':
      return Routes.user.jobs.navigate();
  }
}

export function ProfilePage() {
  const controller = useProfileController();
  const { profile, progressCards, onCardPress, reload } = controller;

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
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.progressRow}
                >
                  {progressCards.map(card => (
                    <View key={card.title}>
                      {renderProfileProgressCard(card, () => onCardPress(card))}
                    </View>
                  ))}
                </ScrollView>

                <View style={styles.featuresSection}>
                  <ProfileFeaturesCard items={FEATURES} onItemPress={onFeaturePress} />
                </View>
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
  progressRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  featuresSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
});
