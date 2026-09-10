import { useEffect, useState } from 'react';
import { useDebouncedValue, useSearchViewController } from '../../../config/components/form/SearchViewController';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';
import { SearchCases } from './SearchCases';
import { SearchResultItem } from './SearchRepo';

export function useSearchController() {
  const searchView = useSearchViewController();
  const debouncedQuery = useDebouncedValue(searchView.value);
  // Starts non-loading - listTrending's own effect below sets loading only
  // for an actual query, not for the initial trending fetch.
  const loadingController = useLoadingController(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [trending, setTrending] = useState<SearchResultItem[]>([]);
  const hasQuery = debouncedQuery.trim().length > 0;

  useEffect(() => {
    SearchCases.listTrending().then(setTrending);
  }, []);

  useEffect(() => {
    if (!hasQuery) {
      setResults([]);
      return;
    }

    let cancelled = false;
    loadingController.setLoading(true);
    SearchCases.search(debouncedQuery)
      .then(items => {
        if (!cancelled) {setResults(items);}
      })
      .finally(() => {
        if (!cancelled) {loadingController.stopLoading();}
      });

    return () => {
      cancelled = true;
    };
    // loadingController is a fresh object every render (see
    // useLoadingController) - only debouncedQuery/hasQuery should retrigger
    // this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, hasQuery]);

  return {
    searchView,
    loadingController,
    results,
    trending,
    hasQuery,
  };
}
