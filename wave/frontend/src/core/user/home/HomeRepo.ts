import { DataResponse, Json, asJson } from '../../../config/network/data_response';
import { YouMightLikeItem } from '../../../config/components/home/YouMightLikeModel';
import { BannerSliderItem } from '../../../config/components/carousel/BannerSliderModel';
import { CarouselModel } from '../../../config/components/carousel/CarouselModel';
import { MatchedCardItem } from '../../../config/components/home/MatchedCardModel';
import { AmiForYouItem } from '../../../config/components/home/AmiForYouModel';
import { CategoryGridSection } from '../../../config/components/home/CategoryGridModel';
import {
  MOCK_HOME_SUMMARY,
  MOCK_YOU_MIGHT_LIKE,
  MOCK_BANNER_SLIDER,
  MOCK_MATCHED_CARDS,
  MOCK_AMI_FOR_YOU,
  MOCK_CATEGORY_GRIDS,
} from '../../../mock_data/HomeMockData';

export type HomeSummary = {
  greeting: string;
  activeJobsCount: number;
  carouselItems: CarouselModel[];
};

export const HomeRepo = {
  fetchSummary: (): Promise<DataResponse<Json>> =>
    new Promise(resolve => setTimeout(() => resolve(DataResponse.success(asJson(MOCK_HOME_SUMMARY))), 200)),
  fetchYouMightLike: (): Promise<YouMightLikeItem[]> =>
    new Promise(resolve => setTimeout(() => resolve(MOCK_YOU_MIGHT_LIKE), 700)),
  fetchBannerSlider: (): Promise<BannerSliderItem[]> =>
    new Promise(resolve => setTimeout(() => resolve(MOCK_BANNER_SLIDER), 700)),
  fetchMatchedCards: (): Promise<MatchedCardItem[]> =>
    new Promise(resolve => setTimeout(() => resolve(MOCK_MATCHED_CARDS), 700)),
  fetchAmiForYou: (): Promise<AmiForYouItem[]> =>
    new Promise(resolve => setTimeout(() => resolve(MOCK_AMI_FOR_YOU), 700)),
  fetchCategoryGrids: (): Promise<CategoryGridSection[]> =>
    new Promise(resolve => setTimeout(() => resolve(MOCK_CATEGORY_GRIDS), 700)),
};
