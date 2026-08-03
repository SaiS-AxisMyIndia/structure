import { DashboardRepo, HomeSummary } from './DashboardRepo';

export const DashboardCases = {
  getSummary: (): Promise<HomeSummary> => DashboardRepo.fetchSummary(),
};
