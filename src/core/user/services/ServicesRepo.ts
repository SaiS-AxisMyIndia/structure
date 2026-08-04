import { ApiSheet } from '../../../config/network/api_sheet';
import { SecureCall } from '../../../config/network/secure_call';

export type ServicesSummary = {
  greeting: string;
  activeServicesCount: number;
};

export const ServicesRepo = {
  fetchSummary: (): Promise<ServicesSummary> => SecureCall<ServicesSummary>(ApiSheet.user.services),
};
