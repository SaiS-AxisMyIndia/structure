import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type HomeSummary = {
  greeting: string;
  pendingAssignmentsCount: number;
};

export const DashboardRepo = {
  fetchSummary: (): Promise<HomeSummary> => secureCall<HomeSummary>(ApiSheet.surveyor.home),
};