import { SettingsSRepo, SettingsSummary } from './SettingsSRepo';

export const SettingsSCases = {
  getSummary: (): Promise<SettingsSummary> => SettingsSRepo.fetchSummary(),
};
