import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type SettingsSummary = {
  greeting: string;
  pendingUpdatesCount: number;
};

export const SettingsSRepo = {
  fetchSummary: (): Promise<SettingsSummary> =>
    secureCall<SettingsSummary>(ApiSheet.surveyor.settings),
};
