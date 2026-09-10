import { SEARCH_CATALOG } from '../../../mock_data/SearchMockData';

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
};

// How many trending items to show before the user has typed anything.
const TRENDING_COUNT = 5;

export const SearchRepo = {
  // TODO: swap for a real endpoint once one exists - filters the same
  // static catalog client-side for now.
  search: (query: string): Promise<SearchResultItem[]> =>
    new Promise(resolve => {
      const trimmed = query.trim().toLowerCase();
      const results = trimmed
        ? SEARCH_CATALOG.filter(
            item => item.title.toLowerCase().includes(trimmed) || item.subtitle.toLowerCase().includes(trimmed),
          )
        : [];
      setTimeout(() => resolve(results), 300);
    }),

  listTrending: (): Promise<SearchResultItem[]> =>
    new Promise(resolve => setTimeout(() => resolve(SEARCH_CATALOG.slice(0, TRENDING_COUNT)), 300)),
};
