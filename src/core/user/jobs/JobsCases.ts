import { Job, JobsRepo } from './JobsRepo';

export const JobsCases = {
  listJobs: (): Promise<Job[]> => JobsRepo.fetchJobs(),
  getJob: (id: string): Promise<Job> => JobsRepo.fetchJobDetail(id),
};