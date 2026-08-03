import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type NeedsSummary = {
  greeting: string;
  openNeedsCount: number;
};

export const NeedsSRepo = {
  fetchSummary: (): Promise<NeedsSummary> => secureCall<NeedsSummary>(ApiSheet.surveyor.needs),
};
