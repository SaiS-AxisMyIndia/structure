import { ApiSheet } from '../../../config/network/api_sheet';
import { SecureCall } from '../../../config/network/secure_call';

export type NeedsSummary = {
  greeting: string;
  openNeedsCount: number;
};

export const NeedsSRepo = {
  fetchSummary: (): Promise<NeedsSummary> => SecureCall<NeedsSummary>(ApiSheet.surveyor.needs),
};
