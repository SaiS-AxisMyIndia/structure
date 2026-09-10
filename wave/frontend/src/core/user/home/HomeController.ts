import { useEffect, useState } from 'react';
import Toast from 'react-native-simple-toast';
import { HomeCases } from './HomeCases';
import { HomeSummary } from './HomeRepo';
import { isSuccess } from '../../../config/network/data_response';
import { YouMightLikeItem } from '../../../config/components/home/YouMightLikeModel';
import { BannerSliderItem } from '../../../config/components/carousel/BannerSliderModel';
import { CarouselImageModel, CarouselModel, CarouselVideoModel } from '../../../config/components/carousel/CarouselModel';
import { MatchedCardItem } from '../../../config/components/home/MatchedCardModel';
import { AmiForYouItem } from '../../../config/components/home/AmiForYouModel';
import { CategoryGridSection } from '../../../config/components/home/CategoryGridModel';
import { ProfileProgressCardItem } from '../../../config/components/profile/ProfileProgressModel';
import { CompactNewsItem } from '../../../config/components/news/NewsModel';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';
import { Routes } from '../../../config/routes/registry';

export function useHomeController() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);
  const [inactiveProfileCards, setInactiveProfileCards] = useState<ProfileProgressCardItem[]>([]);
  const [preferredNews, setPreferredNews] = useState<CompactNewsItem[]>([]);
  const [youMightLike, setYouMightLike] = useState<YouMightLikeItem[]>([]);
  const [bannerSliderItems, setBannerSliderItems] = useState<BannerSliderItem[]>([]);
  const [matchedCards, setMatchedCards] = useState<MatchedCardItem[]>([]);
  const [amiForYou, setAmiForYou] = useState<AmiForYouItem[]>([]);
  const [categoryGrids, setCategoryGrids] = useState<CategoryGridSection[]>([]);
  const [carouselResetKey, setCarouselResetKey] = useState(0);
  const loadingController = useLoadingController();

  const onCardPress = (item: ProfileProgressCardItem) => {
    Toast.show(`${item.title} - coming soon`, Toast.SHORT);
  };

  const onCarouselFullyVisible = (_item: CarouselModel, _repeat: boolean) => {
    // Toast.show(`Visible Count: +1 ${_repeat ? ' (repeat)' : ''}`, Toast.SHORT);
  };

  const onCarouselVideoPlay = (_item: CarouselVideoModel) => {
    Toast.show('Playing video', Toast.SHORT);
  };

  const onCarouselImagePress = (item: CarouselImageModel) => {
    Routes.deepLink(item.route);
  };

  const onBannerPress = () => {
  };

  const load = async () => {
    loadingController.setLoading(true);
    try {
   const [homeSummaryResponse, cards, news, likes, bannerSlides, matched, amiItems, grids] = await Promise.all([
        HomeCases.getSummary(),
        HomeCases.listInactiveProgressCards(),
        HomeCases.preferredNewsFeed(),
        HomeCases.listYouMightLike(),
        HomeCases.listBannerSlider(),
        HomeCases.listMatchedCards(),
        HomeCases.listAmiForYou(),
        HomeCases.listCategoryGrids(),
      ]);
      if (isSuccess(homeSummaryResponse)) {
        setSummary(homeSummaryResponse.data);
      }
      setCarouselResetKey(prev => prev + 1);
      setInactiveProfileCards(cards);
      setPreferredNews(news);
      setYouMightLike(likes);
      setBannerSliderItems(bannerSlides);
      setMatchedCards(matched);
      setAmiForYou(amiItems);
      setCategoryGrids(grids);
      loadingController.setLoading(false);
      await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
      loadingController.setHover(true);
      await new Promise<void>(resolve => setTimeout(() => resolve(), 2000));
      loadingController.stopLoading();
    } catch (err) {
      loadingController.setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    summary,
    inactiveProfileCards,
    onCardPress,
    preferredNews,
    youMightLike,
    bannerSliderItems,
    matchedCards,
    amiForYou,
    categoryGrids,
    carouselResetKey,
    onCarouselFullyVisible,
    onCarouselVideoPlay,
    onCarouselImagePress,
    onBannerPress,
    reload: load,
    loadingController,
  };
}
