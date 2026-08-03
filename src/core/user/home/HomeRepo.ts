import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type HomeSummary = {
  greeting: string;
  activeJobsCount: number;
};

export const HomeRepo = {
  fetchSummary: (): Promise<HomeSummary> => secureCall<HomeSummary>(ApiSheet.user.home),
};