import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type SchemesSummary = {
  greeting: string;
  activeSchemesCount: number;
};

export const SchemesRepo = {
  fetchSummary: (): Promise<SchemesSummary> => secureCall<SchemesSummary>(ApiSheet.user.schemes),
};
