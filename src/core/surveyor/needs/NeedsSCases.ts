import { NeedsSRepo, NeedsSummary } from './NeedsSRepo';

export const NeedsSCases = {
  getSummary: (): Promise<NeedsSummary> => NeedsSRepo.fetchSummary(),
};
