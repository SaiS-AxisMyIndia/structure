import { useEffect, useState } from 'react';
import Toast from 'react-native-simple-toast';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';
import { SubscriptionCases } from './SubscriptionCases';
import { SubscriptionPlan } from './SubscriptionRepo';

export function useSubscriptionController() {
  const loadingController = useLoadingController();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const load = async () => {
    loadingController.setLoading(true);
    try {
      setPlans(await SubscriptionCases.getPlans());
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

  // No payment endpoint exists yet (see backend's RazorpayService stub) -
  // this is the eventual call site for creating an order against `plan`.
  const onSelectPlan = (plan: SubscriptionPlan) => {
    if (plan.isCurrent) {return;}
    Toast.show(`Upgrading to ${plan.name} - coming soon`, Toast.SHORT);
  };

  return {
    loadingController,
    plans,
    onSelectPlan,
    reload: load,
  };
}
