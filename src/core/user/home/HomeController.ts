import { useCallback, useEffect, useState } from 'react';
import { HomeCases } from './HomeCases';
import { HomeSummary } from './HomeRepo';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useHomeController() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const loadingController = useLoadingController();

  const load = async () => {
    loadingController.setLoading(true);
    await new Promise(resolve => setTimeout(() => resolve(undefined), 1000)); // Simulate delay
    try {
      setSummary(await HomeCases.getSummary());
    await new Promise(resolve => setTimeout(() => resolve(undefined), 1000)); // Simulate delay
    loadingController.setError("Testing");

    await new Promise(resolve => setTimeout(() => resolve(undefined), 1000)); // Simulate delay
    loadingController.setLoading(false);
    } catch (err) {
      loadingController.setError((err as Error).message);
    } finally {
      loadingController.setHover(true);
    await new Promise(resolve => setTimeout(() => resolve(undefined), 5000)); // Simulate delay
    loadingController.stopLoading();
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { summary, reload: load, loadingController };
}

