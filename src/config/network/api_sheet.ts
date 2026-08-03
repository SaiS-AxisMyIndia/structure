export const ApiSheet = {
  user: {
    home: '/user/home',
    jobs: '/user/jobs',
    jobDetail: (id: string) => `/user/jobs/${id}`,
    schemes: '/user/schemes',
    services: '/user/services',
    notifications: '/user/notifications',
    profile: '/user/profile',
    news: '/user/news',
    newsDetail: (id: string) => `/user/news/${id}`,
    explore: '/user/explore',
  },
  surveyor: {
    home: '/surveyor/home',
    surveyor: '/surveyor/assignments',
    needs: '/surveyor/needs',
    settings: '/surveyor/settings',
  },
} as const;
