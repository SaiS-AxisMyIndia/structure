import { SUBSCRIPTION_PLANS } from '../../../mock_data/SubscriptionMockData';

export type SubscriptionInterval = 'month' | 'year';

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  interval: SubscriptionInterval;
  features: string[];
  isCurrent: boolean;
};

export const SubscriptionRepo = {
  // TODO: swap for a real endpoint once one exists - see the backend's
  // RazorpayService stub (backend/src/config/razorpay/), the eventual
  // source of the order this screen would create against a plan's price.
  fetchPlans: (): Promise<SubscriptionPlan[]> =>
    new Promise(resolve => setTimeout(() => resolve(SUBSCRIPTION_PLANS), 500)),
};
