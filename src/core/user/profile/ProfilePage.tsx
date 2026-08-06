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
import { ImageLoader } from '../../../config/components/images/ImageLoader';
import { SvgIcon } from '../../../config/components/images/SvgIcon';
import { SvgIcons } from '../../../config/components/images/svg_icons';

const AVATAR_SIZE = 100;

const FEATURES: ProfileFeatureItem[] = [
  { title: 'My Surveys', icon: SvgIcons.survey },
  { title: 'My Schemes', icon: SvgIcons.schemes },
  { title: 'My Services', icon: SvgIcons.services },
  { title: 'My Jobs', icon: SvgIcons.jobs },
];

const ACKNOWLEDGMENT: ProfileFeatureItem[] = [
  { title: 'News', icon: SvgIcons.news },
  { title: 'Needs', icon: SvgIcons.needs },
  { title: 'Ayushman Bharat Hospitals', icon: SvgIcons.hospital },
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
    case 'News':
      return Routes.user.news.navigate();
    case 'Needs':
      return Routes.common.webview.navigate({ url: AppConstants.urls.example });
    case 'Ayushman Bharat Hospitals':
      return Routes.common.webview.navigate({ url: AppConstants.urls.example });
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
              <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.avatarWrap}>
                  {profile.image ? (
                    <ImageLoader
                      source={{ uri: profile.image }}
                      style={styles.avatarImage}
                      borderRadius={AVATAR_SIZE / 2}
                    />
                  ) : (
                    <SvgIcon icon={SvgIcons.profile} size={AVATAR_SIZE} />
                  )}
                </View>
                <Text style={styles.name}>{profile.name}</Text>
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
                 <View style={styles.featuresSection}>
                  <ProfileFeaturesCard title='Acknowledgment' items={ACKNOWLEDGMENT} onItemPress={onFeaturePress} />
                </View>
              </ScrollView>
            ) : null
          }
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 24,
  },
  avatarWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  detail: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
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
