import { ServicesRepo, ServicesSummary } from './ServicesRepo';

export const ServicesCases = {
  getSummary: (): Promise<ServicesSummary> => ServicesRepo.fetchSummary(),
};
