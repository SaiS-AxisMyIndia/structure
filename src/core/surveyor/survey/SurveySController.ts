import { useCallback, useEffect, useState } from 'react';
import { SurveySCases } from './SurveySCases';
import { Assignment } from './SurveySRepo';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useSurveySController() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const loadingController = useLoadingController();
  const { setLoading, setError } = loadingController;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAssignments(await SurveySCases.listAssignments());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError]);

  useEffect(() => {
    load();
  }, [load]);

  return { assignments, loading: loadingController.loading(), reload: load, loadingController };
}
