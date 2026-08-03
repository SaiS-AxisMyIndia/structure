import { useEffect, useState } from 'react';
import { JobsCases } from './JobsCases';
import { Job } from './JobsRepo';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useJobsController() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const loadingController = useLoadingController();

  const load = async () => {
    loadingController.setLoading(true);
    await new Promise(resolve => setTimeout(() => resolve(undefined), 1000)); // Simulate delay
    try {
      setJobs(await JobsCases.listJobs());
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

  return { jobs, loading: loadingController.loading(), reload: load, loadingController };
}
