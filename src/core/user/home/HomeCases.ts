import { HomeRepo, HomeSummary, YouMightLikeItem } from './HomeRepo';

export const HomeCases = {
  getSummary: (): Promise<HomeSummary> => HomeRepo.fetchSummary(),
  listYouMightLike: (): Promise<YouMightLikeItem[]> => HomeRepo.fetchYouMightLike(),
};