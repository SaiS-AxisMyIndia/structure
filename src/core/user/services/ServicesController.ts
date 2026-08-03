import { useEffect, useState } from 'react';
import { ServicesCases } from './ServicesCases';
import { ServicesSummary } from './ServicesRepo';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useServicesController() {
  const [summary, setSummary] = useState<ServicesSummary | null>(null);
  const loadingController = useLoadingController();

  const load = async () => {
    loadingController.setLoading(true);
    await new Promise(resolve => setTimeout(() => resolve(undefined), 1000)); // Simulate delay
    try {
      setSummary(await ServicesCases.getSummary());
    await new Promise(resolve => setTimeout(() => resolve(undefined), 1000)); // Simulate delay
    loadingController.setError("Not implemented yet");

    } catch (err) {
      loadingController.setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { summary, reload: load, loadingController };
}
