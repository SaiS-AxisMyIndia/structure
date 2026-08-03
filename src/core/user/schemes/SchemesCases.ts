import { SchemesRepo, SchemesSummary } from './SchemesRepo';

export const SchemesCases = {
  getSummary: (): Promise<SchemesSummary> => SchemesRepo.fetchSummary(),
};
