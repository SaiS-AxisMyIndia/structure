import { useEffect, useState } from 'react';
import { NewsCases } from './NewsCases';
import { NewsItem } from '../../../config/components/news/NewsModel';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';
import { AppConstants } from '../../../config/constants/AppConstants';

export function useNewsController() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(AppConstants.newsCategories[0]);
  const loadingController = useLoadingController();

  const fetchNews = async (category: string) => {
    loadingController.setLoading(true);
    try {
      setNews(await NewsCases.listNewsByCategory(category));
      loadingController.setLoading(false);
    } catch (err) {
      loadingController.setError((err as Error).message);
    }
  };

  useEffect(() => {
    fetchNews(selectedCategory);
  }, []);

  const onCategoryChange = (category: string) => {
    setSelectedCategory(category);
    fetchNews(category);
  };

  const reload = () => fetchNews(selectedCategory);

  return {
    news,
    loading: loadingController.loading(),
    reload,
    loadingController,
    selectedCategory,
    onCategoryChange,
  };
}
