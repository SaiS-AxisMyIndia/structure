export type HomeSummary = {
  greeting: string;
  activeJobsCount: number;
};

const MOCK_SUMMARY: HomeSummary = {
  greeting: 'Hello',
  activeJobsCount: 3,
};

export const HomeRepo = {
  // TODO: no dev API available yet - swap back to SecureCall<HomeSummary>(ApiSheet.user.home) once it's up.
  fetchSummary: (): Promise<HomeSummary> => new Promise(resolve => setTimeout(() => resolve(MOCK_SUMMARY), 700)),
};