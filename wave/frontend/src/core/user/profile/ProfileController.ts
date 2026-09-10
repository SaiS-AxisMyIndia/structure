import { useEffect, useState } from 'react';
import Toast from 'react-native-simple-toast';
import { ProfileCases } from './ProfileCases';
import { Profile } from './ProfileRepo';
import { ProfileProgressCardItem } from '../../../config/components/profile/ProfileProgressModel';
import { ProfileFeatureItem } from '../../../config/components/profile/ProfileFeaturesModel';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';
import { Routes } from '../../../config/routes/registry';
import { AStorage } from '../../../config/storage/AStorage';

// No language-picker UI exists yet, so this just cycles through a fixed
// list on tap - enough to demonstrate the selectedLanguage wiring end to
// end (ProfilePage.tsx's Account row shows "Language (<current>)") without
// building a whole picker for it.
const SUPPORTED_LANGUAGES = ['English', 'Hindi'];

export function useProfileController() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progressCards, setProgressCards] = useState<ProfileProgressCardItem[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const loadingController = useLoadingController();
  // ProfileMenuSheet/LogoutSheet's own visibility - onAvatarPress (tapping
  // the avatar) and onLogoutFooterPress (LogoutFooter's row) only open
  // them; onLogoutPress below is what the sheet's own "Logout" actually
  // confirms.
  const [menuVisible, setMenuVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);

  const onAvatarPress = () => setMenuVisible(true);
  const onMenuClose = () => setMenuVisible(false);
  const onLogoutFooterPress = () => setLogoutVisible(true);
  const onLogoutSheetClose = () => setLogoutVisible(false);

  const onCardPress = (item: ProfileProgressCardItem) => {
    if (item.title === 'About You') {
      return Routes.user.aboutYou.navigate();
    }
    if (item.title === 'Location Details') {
      return Routes.user.locationDetails.navigate();
    }
    if (item.title === 'Area of Interests') {
      return Routes.user.areaOfInterest.navigate();
    }
    if (item.title === 'Family Details') {
      return Routes.user.familyDetails.navigate();
    }
    if (item.title === 'Job Eligibility') {
      return Routes.user.jobEligibility.navigate();
    }
    if (item.title === 'Scheme Eligibility') {
      return Routes.user.schemeEligibility.navigate();
    }
    if (item.title === 'Other Details') {
      return Routes.user.otherDetails.navigate();
    }
    Toast.show(`${item.title} - coming soon`, Toast.SHORT);
  };

  const onLanguagePress = () => {
    setSelectedLanguage(prev => {
      const nextIndex = (SUPPORTED_LANGUAGES.indexOf(prev) + 1) % SUPPORTED_LANGUAGES.length;
      return SUPPORTED_LANGUAGES[nextIndex];
    });
  };

  // Dispatch by `item.id` (stable) rather than `item.title` (which for the
  // Language row changes every time it's pressed) - see
  // ProfileFeaturesModel.ts. Rows with no real destination yet (Reward
  // Points, Refer a Friend, Help & Support) fall through to the same
  // "coming soon" toast onCardPress already uses above.
  const onFeaturePress = (item: ProfileFeatureItem) => {
    switch (item.id) {
      case 'surveys':
        // "My Surveys" opens a single page stacking Dashboard summary +
        // Surveys + Needs + Settings (see MySurveysPage.tsx) rather than
        // jumping straight into the external survey webview - that webview
        // is still reached from inside the page's own Available Surveys
        // list (see MySurveysController.ts's onAvailableSurveyPress).
        return Routes.user.mySurveys.navigate();
      case 'my-schemes':
        return Routes.user.schemes.navigate();
      case 'my-services':
        return Routes.user.servicesSearch.navigate();
      case 'my-jobs':
        return Routes.user.jobs.navigate();
      case 'news':
        return Routes.user.news.navigate();
      case 'needs':
        return Routes.user.needs.navigate();
      case 'hospitals':
        return Routes.user.hospital.navigate();
      case 'language':
        return onLanguagePress();
      case 'settings':
        return Routes.user.settings.navigate();
      default:
        Toast.show(`${item.title} - coming soon`, Toast.SHORT);
    }
  };

  // ProfileMenuSheet.tsx's three rows - View Profile has nowhere else to go
  // (it's opened from this same page), and Upload Image/Open Camera need an
  // actual image-picker library, which doesn't exist in this app yet (see
  // ProfilePage.tsx's note on that). Same "coming soon" toast convention as
  // onCardPress/onFeaturePress's default case above, so all three are at
  // least visibly wired rather than silent no-ops.
  const onViewProfileClick = () => {
    Toast.show('View Profile - coming soon', Toast.SHORT);
  };

  const onUploadImageClick = () => {
    Toast.show('Upload Image - coming soon', Toast.SHORT);
  };

  const onOpenCameraClick = () => {
    Toast.show('Open Camera - coming soon', Toast.SHORT);
  };

  // Clears the stored session (tokens/user/language/walkthroughs - see
  // AStorage.logout()) before resetting the nav stack to the login screen,
  // same primitive DeleteAccountController.onConfirmDelete already uses.
  const onLogoutPress = async () => {
    await AStorage.logout();
    Routes.auth.login.clearAll();
  };

  const load = async () => {
    loadingController.setLoading(true);
    try {
      const { profile: profileResult, progressCards: cards } = await ProfileCases.getProfile();
      setProfile(profileResult);
      setProgressCards(cards);
    } catch (err) {
      loadingController.setError((err as Error).message);
    } finally {
      loadingController.setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // load is a fresh function every render - depending on it here would
    // re-run this on every render instead of just once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    profile,
    progressCards,
    selectedLanguage,
    onCardPress,
    onFeaturePress,
    onViewProfileClick,
    onUploadImageClick,
    onOpenCameraClick,
    menuVisible,
    onAvatarPress,
    onMenuClose,
    logoutVisible,
    onLogoutFooterPress,
    onLogoutSheetClose,
    onLogoutPress,
    reload: load,
    loadingController,
  };
}
