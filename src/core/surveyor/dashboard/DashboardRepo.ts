import { ApiSheet } from '../../../config/network/api_sheet';
import { SecureCall } from '../../../config/network/secure_call';

export type HomeSummary = {
  greeting: string;
  pendingAssignmentsCount: number;
};

export const DashboardRepo = {
  fetchSummary: (): Promise<HomeSummary> => SecureCall<HomeSummary>(ApiSheet.surveyor.home),
};