type SchemeFiltersQuery = Record<string, string | number | boolean | undefined>;

export const ApiSheet = {
  auth: {
    refresh: '/user/v1/auth/refresh-token',
  },
  user: {
    generateOtp: '/user/v1/auth/generate-otp',
    validateOtp: '/user/v1/auth/validate-otp',
    home: '/user/home',
    jobs: '/user/jobs',
    jobDetail: (id: string) => `/user/jobs/${id}`,
    services: '/user/services',
    notifications: '/user/notifications',
    profile: '/v1/user/profile/',
    news: '/user/news',
    newsDetail: (id: string) => `/user/news/${id}`,
    explore: '/user/explore',
  },
  schemes: {
    all: '/user/schemes',
    list: ({ page, size, categoryId }: { page: number; size: number; categoryId?: number }) =>
      `/v1/schemes/list?page=${page}&size=${size}${categoryId !== undefined ? `&categoryId=${categoryId}` : ''}`,
    details: (id: string) => `/v1/schemes/scheme-details/${id}`,
    filters: (page: number, size: number, filters: SchemeFiltersQuery = {}) => {
      const query = Object.entries(filters)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${key}=${value}`)
        .join('&');
      return `/v1/schemes/filters?page=${page}&size=${size}${query ? `&${query}` : ''}`;
    },
  },
  hospitals: {
    list: ({ lat, lon, page, size }: { lat: number; lon: number; page: number; size: number }) =>
      `/v1/hospitals/?lat=${lat}&lon=${lon}&page=${page}&size=${size}`,
  },
} as const;
