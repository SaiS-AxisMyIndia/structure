import { NewsItem } from '../../../config/components/news/NewsModel';
import { AppConstants } from '../../../config/constants/AppConstants';

const CNBC_LOGO = 'https://picsum.photos/seed/cnbc-logo/80/80';
const TRUMP_TITLE = "Trump floods social media with AI images targeting rivals and promoting 'Trump 2028' | In pics";

// Stands in for the server's UTC timestamp on each item - computed relative
// to "now" so the mock feed still reads as "Today"/"Yesterday" etc. through
// DateFormatter.smart() no matter when it's demoed.
const DAY_MS = 24 * 60 * 60 * 1000;
const isoDaysAgo = (days: number) => new Date(Date.now() - days * DAY_MS).toISOString();

const SAMPLE_NEWS: NewsItem[] = [
  {
    id: '1',
    kind: 'banner',
    source: 'CNBC TV18',
    sourceLogo: CNBC_LOGO,
    time: isoDaysAgo(0),
    title: TRUMP_TITLE,
    image: 'https://picsum.photos/seed/breaking-news/400/240',
    views: 200000,
    url: 'https://example.com/news/trump-ai-images',
  },
  {
    id: '2',
    kind: 'compact',
    source: 'CNBC TV18',
    sourceLogo: CNBC_LOGO,
    time: isoDaysAgo(0),
    title: TRUMP_TITLE,
    image: 'https://picsum.photos/seed/breaking-news-2/200/200',
    views: 200000,
    url: 'https://example.com/news/trump-ai-images',
  },
  {
    id: '3',
    kind: 'compact',
    source: 'Ayushman Hospitals',
    sourceLogo: 'https://picsum.photos/seed/pmjay-logo/80/80',
    time: isoDaysAgo(1),
    title: 'New hospitals added to the Ayushman Bharat network across three states',
    image: 'https://picsum.photos/seed/hospital-news/200/200',
    views: 45000,
    url: 'https://example.com/news/ayushman-network-expansion',
  },
  {
    id: '4',
    kind: 'banner',
    source: 'Axis My India',
    sourceLogo: 'https://picsum.photos/seed/axis-logo/80/80',
    time: isoDaysAgo(2),
    title: 'Survey drive completion crosses 80% milestone this quarter',
    image: 'https://picsum.photos/seed/survey-news/400/240',
    views: 12000,
    url: 'https://example.com/news/survey-milestone',
  },
  {
    id: '5',
    kind: 'video',
    source: 'CNBC TV18',
    sourceLogo: CNBC_LOGO,
    time: isoDaysAgo(0),
    title: 'Watch: Highlights from today’s market wrap-up',
    image: 'https://picsum.photos/seed/market-video/400/240',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    videoSource: 'public',
    views: 87000,
    url: 'https://example.com/news/market-wrap-video',
  },
];

// Dummy per-category feeds, keyed by the AppConstants.newsCategories labels
// (bar 'All', which just means "the unfiltered feed"). Standing in for a
// real "fetch news filtered by category" endpoint - swap this map out once
// that API exists.
const CATEGORY_NEWS: Record<string, NewsItem[]> = {
  'AMI News': SAMPLE_NEWS.filter(item => item.source === 'Axis My India' || item.source === 'CNBC TV18'),
  Health: [
    {
      id: 'health-1',
      kind: 'compact',
      source: 'Ayushman Hospitals',
      sourceLogo: 'https://picsum.photos/seed/pmjay-logo/80/80',
      time: isoDaysAgo(1),
      title: 'New hospitals added to the Ayushman Bharat network across three states',
      image: 'https://picsum.photos/seed/hospital-news/200/200',
      views: 45000,
      url: 'https://example.com/news/ayushman-network-expansion',
    },
  ],
  Agriculture: [
    {
      id: 'agri-1',
      kind: 'compact',
      source: 'Down To Earth',
      sourceLogo: 'https://picsum.photos/seed/agri-logo/80/80',
      time: isoDaysAgo(3),
      title: 'Farmers adopt new irrigation techniques amid changing monsoon patterns',
      image: 'https://picsum.photos/seed/agri-news/200/200',
      views: 8000,
      url: 'https://example.com/news/irrigation-adoption',
    },
  ],
  Environment: [
    {
      id: 'env-1',
      kind: 'compact',
      source: 'Down To Earth',
      sourceLogo: 'https://picsum.photos/seed/env-logo/80/80',
      time: isoDaysAgo(4),
      title: 'Air quality index improves across major cities after policy push',
      image: 'https://picsum.photos/seed/env-news/200/200',
      views: 15000,
      url: 'https://example.com/news/air-quality-improves',
    },
  ],
};

export const NewsRepo = {
  fetchNews: (): Promise<NewsItem[]> =>
    new Promise(resolve => setTimeout(() => resolve(SAMPLE_NEWS), 700)),

  fetchNewsByCategory: (category: string): Promise<NewsItem[]> =>
    new Promise(resolve =>
      setTimeout(
        () => resolve(category === AppConstants.newsCategories[0] ? SAMPLE_NEWS : CATEGORY_NEWS[category] ?? []),
        700,
      ),
    ),
};
