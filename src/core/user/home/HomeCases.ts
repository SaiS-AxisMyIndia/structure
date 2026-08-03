import { HomeRepo, HomeSummary } from './HomeRepo';

export const HomeCases = {
  getSummary: (): Promise<HomeSummary> => HomeRepo.fetchSummary(),
};