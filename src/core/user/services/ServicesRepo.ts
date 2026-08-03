import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type ServicesSummary = {
  greeting: string;
  activeServicesCount: number;
};

export const ServicesRepo = {
  fetchSummary: (): Promise<ServicesSummary> => secureCall<ServicesSummary>(ApiSheet.user.services),
};
