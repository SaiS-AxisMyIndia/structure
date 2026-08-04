import { ApiSheet } from '../../../config/network/api_sheet';
import { SecureCall } from '../../../config/network/secure_call';

export type Job = {
  id: string;
  title: string;
  status: string;
};

export const JobsRepo = {
  fetchJobs: (): Promise<Job[]> => SecureCall<Job[]>(ApiSheet.user.jobs),
  fetchJobDetail: (id: string): Promise<Job> =>
    SecureCall<Job>(ApiSheet.user.jobDetail(id)),
};