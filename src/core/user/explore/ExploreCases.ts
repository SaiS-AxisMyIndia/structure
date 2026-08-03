import { ExploreRepo, ExploreSummary } from './ExploreRepo';

export const ExploreCases = {
  getSummary: (): Promise<ExploreSummary> => ExploreRepo.fetchSummary(),
};
