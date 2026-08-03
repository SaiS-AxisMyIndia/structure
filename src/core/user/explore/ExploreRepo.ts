import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type ExploreSummary = {
  greeting: string;
  featuredCount: number;
};

export const ExploreRepo = {
  fetchSummary: (): Promise<ExploreSummary> => secureCall<ExploreSummary>(ApiSheet.user.explore),
};
