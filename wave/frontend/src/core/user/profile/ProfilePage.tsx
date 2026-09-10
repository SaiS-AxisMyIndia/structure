import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { TitleBar } from '../../../config/components/appbar/TitleBar';
import { ScreenView } from '../../../config/components/layouts/ScreenView';
import { LoadingView } from '../../../config/components/layouts/LoadingView';
import { ResponsiveView } from '../../../config/components/layouts/ResponsiveView';
import { MobileCenter, SizedCenterProps, TabletCenter, WebCenter } from '../../../config/components/layouts/Center';
import { useProfileController } from './ProfileController';
import { renderProfileProgressCard } from '../../../config/components/profile/ProfileProgressCard';
import { ProfileFeaturesCard } from '../../../config/components/profile/ProfileFeaturesCard';
import { ProfileFeatureItem } from '../../../config/components/profile/ProfileFeaturesModel';
import { ProfileMenuSheet } from '../../../config/components/profile/ProfileMenuSheet';
import { LogoutSheet } from '../../../config/components/auth/LogoutSheet';
import { ImageLoader } from '../../../config/components/images/ImageLoader';
import { SvgIcon } from '../../../config/components/images/SvgIcon';
import { SvgIcons } from '../../../config/components/images/svg_icons';
import { Themer } from '../../../config/theme/Themer';
import { AppColors } from '../../../config/theme/AppColors';
import { LogoutFooter } from '../../../config/components/auth/LogoutFooter';

const AVATAR_SIZE = 100;

const EMPOWERMENT: ProfileFeatureItem[] = [
  { id: 'jobs', title: 'Post a Job', icon: SvgIcons.jobs },
  { id: 'services', title: 'List a Service', icon: SvgIcons.service },
  { id: 'products', title: 'List a Product', icon: SvgIcons.products },
  { id: 'skills', title: 'Skill Community', icon: SvgIcons.skills },
];

const ACKNOWLEDGMENT: ProfileFeatureItem[] = [
  { id: 'news', title: 'News', icon: SvgIcons.news },
  { id: 'needs', title: 'Needs', icon: SvgIcons.needs },
  { id: 'hospitals', title: 'Ayushman Bharat Hospitals', icon: SvgIcons.hospital },
];

type ProfileBodyProps = {
  controller: ReturnType<typeof useProfileController>;
};

// Controller creation lives in ProfilePage now, not here - ProfileBody is
// purely presentational, taking `controller` as a single prop.
// menuVisible/logoutVisible and their open handlers live in
// useProfileController (like everything else Body used to own locally),
// even though the sheets themselves render up in ProfilePage.
export function ProfileBody({ controller }: ProfileBodyProps) {
  const { profile, progressCards, onCardPress, onFeaturePress, selectedLanguage, onAvatarPress, onLogoutFooterPress, reload } =
    controller;

  const ACCOUNT: ProfileFeatureItem[] = [
    { id: 'surveys', title: 'My Surveys', icon: SvgIcons.survey },
    { id: 'activity', title: 'My Activity', icon: SvgIcons.activity },
    { id: 'language', title: `Language (${selectedLanguage})`, icon: SvgIcons.language },
    { id: 'reward-points', title: 'Reward Points', icon: SvgIcons.rewards },
    { id: 'refer-a-friend', title: 'Refer a Friend', icon: SvgIcons.share },
    { id: 'help-support', title: 'Help & Support', icon: SvgIcons.support },
    { id: 'settings', title: 'Settings', icon: SvgIcons.settings },
  ];

  const renderBody = (CenterView: (props: SizedCenterProps) => React.ReactElement) => (
    <LoadingView
      controller={controller.loadingController}
      onRefresh={reload}
      body={
        profile ? (
          <ScrollView contentContainerStyle={styles.container}>
            <CenterView>
              <Pressable style={styles.avatarWrap} onPress={onAvatarPress}>
                {profile.image ? (
                  <ImageLoader
                    source={{ uri: profile.image }}
                    style={styles.avatarImage}
                    borderRadius={AVATAR_SIZE / 2}
                  />
                ) : (
                  <SvgIcon icon={SvgIcons.profile} size={AVATAR_SIZE} />
                )}
              </Pressable>
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
                <ProfileFeaturesCard title="Account" items={ACCOUNT} onItemPress={onFeaturePress} />
              </View>
              <View style={styles.featuresSection}>
                <ProfileFeaturesCard title="Acknowledgment" items={ACKNOWLEDGMENT} onItemPress={onFeaturePress} />
              </View>
              <View style={styles.featuresSection}>
                <ProfileFeaturesCard title="Empowerment" items={EMPOWERMENT} onItemPress={onFeaturePress} gradient={Themer.teritaryGradient} borderColor={AppColors.tertiary200} />
              </View>

              <LogoutFooter onLogoutPress={onLogoutFooterPress} />
            </CenterView>
          </ScrollView>
        ) : null
      }
    />
  );

  function mobile() {
    return renderBody(MobileCenter);
  }

  function tablet() {
    return renderBody(TabletCenter);
  }

  function web() {
    return renderBody(WebCenter);
  }

  return <ResponsiveView mobile={mobile()} tablet={tablet()} web={web()} />;
}

export function ProfilePage() {
  const controller = useProfileController();

  return (
    <>
      <ScreenView
        appbar={<TitleBar title="Profile & Menu" />}
        body={<ProfileBody controller={controller} />}
      />
      <ProfileMenuSheet
        visible={controller.menuVisible}
        onClose={controller.onMenuClose}
        onViewProfile={controller.onViewProfileClick}
        onUploadImage={controller.onUploadImageClick}
        onOpenCamera={controller.onOpenCameraClick}
      />
      <LogoutSheet visible={controller.logoutVisible} onClose={controller.onLogoutSheetClose} onConfirm={controller.onLogoutPress} />
    </>
  );
}

// Body-only variant for embedding as the Profile bottom-bar tab (see
// BottomBarView.tsx) - same controller/content/sheets as ProfilePage's own
// route, minus the ScreenView/TitleBar chrome BottomBarView's MainBar
// already supplies (same convention as HomePage.tsx's HomeBody).
export function ProfileTabBody() {
  const controller = useProfileController();

  return (
    <>
      <ProfileBody controller={controller} />
      <ProfileMenuSheet
        visible={controller.menuVisible}
        onClose={controller.onMenuClose}
        onViewProfile={controller.onViewProfileClick}
        onUploadImage={controller.onUploadImageClick}
        onOpenCamera={controller.onOpenCameraClick}
      />
      <LogoutSheet visible={controller.logoutVisible} onClose={controller.onLogoutSheetClose} onConfirm={controller.onLogoutPress} />
    </>
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
