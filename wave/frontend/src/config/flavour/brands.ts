export type BrandKey = 'IN' | 'US' | 'RU';

export const brands: Record<BrandKey, {displayName: string; accentColor: string}> = {
  IN: {displayName: 'a-appIndia', accentColor: '#FF6B00'},
  US: {displayName: 'a-appUSA', accentColor: '#0057B8'},
  RU: {displayName: 'a-appRussia', accentColor: '#C8102E'},
};
