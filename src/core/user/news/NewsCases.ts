import { CompactNewsItem, NewsItem } from '../../../config/components/news/NewsModel';
import { NewsRepo } from './NewsRepo';

const PREFERRED_FEED_LIMIT = 4;

function isCompact(item: NewsItem): item is CompactNewsItem {
  return item.kind === 'compact';
}

export const NewsCases = {
  
  listNewsByCategory: (category: string): Promise<NewsItem[]> => NewsRepo.fetchNewsByCategory(category),
  
  preferredNewsFeed: async (): Promise<CompactNewsItem[]> =>
    (await NewsRepo.fetchNews()).filter(isCompact).slice(0, PREFERRED_FEED_LIMIT),
};
