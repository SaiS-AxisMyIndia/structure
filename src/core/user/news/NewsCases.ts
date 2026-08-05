import { CompactNewsItem, NewsItem } from '../../../config/components/news/NewsModel';
import { NewsRepo } from './NewsRepo';

const PREFERRED_FEED_LIMIT = 4;

function isCompact(item: NewsItem): item is CompactNewsItem {
  return item.kind === 'compact';
}

export const NewsCases = {
  listNews: (): Promise<NewsItem[]> => NewsRepo.fetchNews(),
  // A short, capped slice of the feed for surfacing elsewhere (e.g. Home).
  // Only compact-kind items fit that narrow slot - banner/video items are
  // skipped rather than squeezed in.
  preferredNewsFeed: async (): Promise<CompactNewsItem[]> =>
    (await NewsRepo.fetchNews()).filter(isCompact).slice(0, PREFERRED_FEED_LIMIT),
};
