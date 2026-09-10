import { SubscriptionPlan, SubscriptionRepo } from './SubscriptionRepo';

export const SubscriptionCases = {
  getPlans: (): Promise<SubscriptionPlan[]> => SubscriptionRepo.fetchPlans(),
};
