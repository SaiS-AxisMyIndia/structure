import { HomeRepo, HomeSummary } from './HomeRepo';
import { DataResponse, isSuccess } from '../../../config/network/data_response';
import { YouMightLikeItem } from '../../../config/components/home/YouMightLikeModel';
import { BannerSliderItem } from '../../../config/components/carousel/BannerSliderModel';
import { MatchedCardItem } from '../../../config/components/home/MatchedCardModel';
import { AmiForYouItem } from '../../../config/components/home/AmiForYouModel';
import { CategoryGridSection } from '../../../config/components/home/CategoryGridModel';
import { ProfileCases } from '../profile/ProfileCases';
import { ProfileProgressCardItem } from '../../../config/components/profile/ProfileProgressModel';
import { NewsCases } from '../news/NewsCases';
import { CompactNewsItem } from '../../../config/components/news/NewsModel';

export const HomeCases = {
  getSummary: async (): Promise<DataResponse<HomeSummary>> => {
    const result = await HomeRepo.fetchSummary();
    if (isSuccess(result)) {
      const summary: HomeSummary = {
        greeting: result.data.get('greeting', ''),
        activeJobsCount: result.data.get('activeJobsCount', 0),
        carouselItems: result.data.get('carouselItems', []),
      };
      return DataResponse.success(summary, result.message);
    }
    return DataResponse.failed(result.message, result.errorCode);
  },

  listInactiveProgressCards: (): Promise<ProfileProgressCardItem[]> => ProfileCases.listInactiveProgressCards(),

  preferredNewsFeed: (): Promise<CompactNewsItem[]> => NewsCases.preferredNewsFeed(),

  listYouMightLike: (): Promise<YouMightLikeItem[]> => HomeRepo.fetchYouMightLike(),

  listBannerSlider: (): Promise<BannerSliderItem[]> => HomeRepo.fetchBannerSlider(),

  listMatchedCards: (): Promise<MatchedCardItem[]> => HomeRepo.fetchMatchedCards(),

  listAmiForYou: (): Promise<AmiForYouItem[]> => HomeRepo.fetchAmiForYou(),

  listCategoryGrids: (): Promise<CategoryGridSection[]> => HomeRepo.fetchCategoryGrids(),
};
