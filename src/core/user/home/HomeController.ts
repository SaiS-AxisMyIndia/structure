import { useEffect, useState } from 'react';
import Toast from 'react-native-simple-toast';
import { HomeCases } from './HomeCases';
import { HomeSummary, YouMightLikeItem } from './HomeRepo';
import { ProfileCases } from '../profile/ProfileCases';
import { ProfileProgressCardItem } from '../../../config/components/profile/ProfileProgressModel';
import { NewsCases } from '../news/NewsCases';
import { CompactNewsItem } from '../../../config/components/news/NewsModel';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useHomeController() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [inactiveProfileCards, setInactiveProfileCards] = useState<ProfileProgressCardItem[]>([]);
  const [preferredNews, setPreferredNews] = useState<CompactNewsItem[]>([]);
  const [youMightLike, setYouMightLike] = useState<YouMightLikeItem[]>([]);
  const loadingController = useLoadingController();

  // TODO: navigate to the section's edit/detail screen once a route exists.
  const onCardPress = (item: ProfileProgressCardItem) => {
    Toast.show(`${item.title} - coming soon`, Toast.SHORT);
  };

  const load = async () => {
    loadingController.setLoading(true);
    try {
      const [homeSummary, cards, news, likes] = await Promise.all([
        HomeCases.getSummary(),
        ProfileCases.listInactiveProgressCards(),
        NewsCases.preferredNewsFeed(),
        HomeCases.listYouMightLike(),
      ]);
      setSummary(homeSummary);
      setInactiveProfileCards(cards);
      setPreferredNews(news);
      setYouMightLike(likes);
      loadingController.setLoading(false);
      await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
      loadingController.setHover(true);
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
      loadingController.stopLoading();
    } catch (err) {
      loadingController.setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return {
    summary,
    inactiveProfileCards,
    onCardPress,
    preferredNews,
    youMightLike,
    reload: load,
    loadingController,
  };
}
