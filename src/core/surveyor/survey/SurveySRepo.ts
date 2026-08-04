import { ApiSheet } from '../../../config/network/api_sheet';
import { SecureCall } from '../../../config/network/secure_call';

export type Assignment = {
  id: string;
  siteName: string;
  status: string;
};

export const SurveySRepo = {
  fetchAssignments: (): Promise<Assignment[]> =>
    SecureCall<Assignment[]>(ApiSheet.surveyor.surveyor),
};
