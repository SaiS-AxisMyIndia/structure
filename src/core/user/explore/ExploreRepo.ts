import { ApiSheet } from '../../../config/network/api_sheet';
import { SecureCall } from '../../../config/network/secure_call';

export type ExploreSummary = {
  greeting: string;
  featuredCount: number;
};

export const ExploreRepo = {
  fetchSummary: (): Promise<ExploreSummary> => SecureCall<ExploreSummary>(ApiSheet.user.explore),
};
