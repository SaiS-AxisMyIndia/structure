import { useEffect, useState } from 'react';
import { HomeCases } from './HomeCases';
import { HomeSummary } from './HomeRepo';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useHomeController() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const loadingController = useLoadingController();

  const load = async () => {
    loadingController.setLoading(true);
    try {
      setSummary(await HomeCases.getSummary());
      loadingController.setLoading(false);
      await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
      loadingController.setHover(true);
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
      loadingController.stopLoading();
    } catch (err) {
      loadingController.setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { summary, reload: load, loadingController };
}

