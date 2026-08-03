import { useEffect, useState } from 'react';
import { SettingsSCases } from './SettingsSCases';
import { SettingsSummary } from './SettingsSRepo';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useSettingsSController() {
  const [summary, setSummary] = useState<SettingsSummary | null>(null);
  const loadingController = useLoadingController();

  const load = async () => {
    loadingController.setLoading(true);
    await new Promise(resolve => setTimeout(() => resolve(undefined), 1000)); // Simulate delay
    try {
      setSummary(await SettingsSCases.getSummary());
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

  return { summary, reload: load, loadingController };
}
