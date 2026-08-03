import { NewsRepo, NewsSummary } from './NewsRepo';

export const NewsCases = {
  getSummary: (): Promise<NewsSummary> => NewsRepo.fetchSummary(),
};
