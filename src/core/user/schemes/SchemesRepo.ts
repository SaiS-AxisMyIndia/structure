import { ApiSheet } from '../../../config/network/api_sheet';
import { SecureCall } from '../../../config/network/secure_call';

export type SchemesSummary = {
  greeting: string;
  activeSchemesCount: number;
};

export const SchemesRepo = {
  fetchSummary: (): Promise<SchemesSummary> => SecureCall<SchemesSummary>(ApiSheet.user.schemes),
};
