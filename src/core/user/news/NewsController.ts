import { useEffect, useState } from 'react';
import { NewsCases } from './NewsCases';
import { NewsItem } from '../../../config/components/news/NewsModel';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useNewsController() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const loadingController = useLoadingController();

  const load = async () => {
    loadingController.setLoading(true);
    try {
      setNews(await NewsCases.listNews());
      loadingController.setLoading(false);
    } catch (err) {
      loadingController.setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { news, loading: loadingController.loading(), reload: load, loadingController };
}
