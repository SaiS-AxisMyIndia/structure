import { useEffect, useState } from 'react';
import { ProfileCases } from './ProfileCases';
import { Profile } from './ProfileRepo';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useProfileController() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const loadingController = useLoadingController();

  const load = async () => {
    loadingController.setLoading(true);
    await new Promise(resolve => setTimeout(() => resolve(undefined), 1000)); // Simulate delay
    try {
      setProfile(await ProfileCases.getProfile());
    await new Promise(resolve => setTimeout(() => resolve(undefined), 1000)); // Simulate delay
    loadingController.setError("Not implemented yet");

    } catch (err) {
      loadingController.setError((err as Error).message);
    } finally {
      loadingController.setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { profile, reload: load, loadingController };
}