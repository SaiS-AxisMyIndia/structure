import { ApiSheet } from '../../../config/network/api_sheet';
import { secureCall } from '../../../config/network/secure_call';

export type Job = {
  id: string;
  title: string;
  status: string;
};

export const JobsRepo = {
  fetchJobs: (): Promise<Job[]> => secureCall<Job[]>(ApiSheet.user.jobs),
  fetchJobDetail: (id: string): Promise<Job> =>
    secureCall<Job>(ApiSheet.user.jobDetail(id)),
};