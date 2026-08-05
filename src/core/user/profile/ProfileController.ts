import { useEffect, useState } from 'react';
import Toast from 'react-native-simple-toast';
import { ProfileCases } from './ProfileCases';
import { Profile } from './ProfileRepo';
import { ProfileProgressCardItem } from '../../../config/components/profile/ProfileProgressModel';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useProfileController() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [progressCards, setProgressCards] = useState<ProfileProgressCardItem[]>([]);
  const loadingController = useLoadingController();

  // TODO: navigate to the section's edit/detail screen once a route exists.
  const onCardPress = (item: ProfileProgressCardItem) => {
    Toast.show(`${item.title} - coming soon`, Toast.SHORT);
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
  }

  useEffect(() => {
    load();
  }, []);

  return { profile, progressCards, onCardPress, reload: load, loadingController };
}
