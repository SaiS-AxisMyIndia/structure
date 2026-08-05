import { NewsDetails } from '../../../config/components/news_details/NewsDetailsModel';
import { NewsDetailsRepo } from './NewsDetailsRepo';

export const NewsDetailsCases = {
  getDetails: (id: string): Promise<NewsDetails> => NewsDetailsRepo.fetchDetails(id),
};
