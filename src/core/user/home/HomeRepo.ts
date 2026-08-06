export type HomeSummary = {
  greeting: string;
  activeJobsCount: number;
};

// "You Might Like" row on Home - each card is a single pre-designed image
// (icon/title/button all baked into the asset itself), so this side of the
// app only needs the image and where tapping it should go. `route` follows
// the same convention as NotificationBase.route - a plain route path, or an
// `<Internal>`/`<External>` URL - see Routes.deepLink().
export type YouMightLikeItem = {
  id: string;
  image: string;
  route?: string;
};

const MOCK_SUMMARY: HomeSummary = {
  greeting: 'Hello',
  activeJobsCount: 3,
};

const MOCK_YOU_MIGHT_LIKE: YouMightLikeItem[] = [
  {
    id: '1',
    image: 'https://picsum.photos/seed/utilities-card/300/400',
    route: '/user/services',
  },
  {
    id: '2',
    image: 'https://picsum.photos/seed/schemes-card/300/400',
    route: '/user/schemes',
  },
  {
    id: '3',
    image: 'https://picsum.photos/seed/survey-card/300/400',
    route: '/user/services',
  },
    {
    id: '1',
    image: 'https://picsum.photos/seed/utilities-card/300/400',
    route: '/user/services',
  },
  {
    id: '2',
    image: 'https://picsum.photos/seed/schemes-card/300/400',
    route: '/user/schemes',
  },
  {
    id: '3',
    image: 'https://picsum.photos/seed/survey-card/300/400',
    route: '/user/services',
  },
    {
    id: '1',
    image: 'https://picsum.photos/seed/utilities-card/300/400',
    route: '/user/services',
  },
  {
    id: '2',
    image: 'https://picsum.photos/seed/schemes-card/300/400',
    route: '/user/schemes',
  },
  {
    id: '3',
    image: 'https://picsum.photos/seed/survey-card/300/400',
    route: '/user/services',
  },
];

export const HomeRepo = {
  // TODO: no dev API available yet - swap back to SecureCall<HomeSummary>(ApiSheet.user.home) once it's up.
  fetchSummary: (): Promise<HomeSummary> => new Promise(resolve => setTimeout(() => resolve(MOCK_SUMMARY), 700)),
  fetchYouMightLike: (): Promise<YouMightLikeItem[]> =>
    new Promise(resolve => setTimeout(() => resolve(MOCK_YOU_MIGHT_LIKE), 700)),
};