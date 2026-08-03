import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type Assignment = {
  id: string;
  siteName: string;
  status: string;
};

export const SurveySRepo = {
  fetchAssignments: (): Promise<Assignment[]> =>
    secureCall<Assignment[]>(ApiSheet.surveyor.surveyor),
};
