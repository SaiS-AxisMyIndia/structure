import { Assignment, SurveySRepo } from './SurveySRepo';

export const SurveySCases = {
  listAssignments: (): Promise<Assignment[]> => SurveySRepo.fetchAssignments(),
};
