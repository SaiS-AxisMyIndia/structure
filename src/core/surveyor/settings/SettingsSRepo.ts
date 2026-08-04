import { ApiSheet } from '../../../config/network/api_sheet';
import { SecureCall } from '../../../config/network/secure_call';

export type SettingsSummary = {
  greeting: string;
  pendingUpdatesCount: number;
};

export const SettingsSRepo = {
  fetchSummary: (): Promise<SettingsSummary> =>
    SecureCall<SettingsSummary>(ApiSheet.surveyor.settings),
};
