import { SearchRepo, SearchResultItem } from './SearchRepo';

export const SearchCases = {
  search: (query: string): Promise<SearchResultItem[]> => SearchRepo.search(query),
  listTrending: (): Promise<SearchResultItem[]> => SearchRepo.listTrending(),
};
