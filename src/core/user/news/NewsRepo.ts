import { NewsItem } from '../../../config/components/news/NewsModel';

const CNBC_LOGO = 'https://picsum.photos/seed/cnbc-logo/80/80';
const TRUMP_TITLE = "Trump floods social media with AI images targeting rivals and promoting 'Trump 2028' | In pics";

const SAMPLE_NEWS: NewsItem[] = [
  {
    id: '1',
    kind: 'banner',
    source: 'CNBC TV18',
    sourceLogo: CNBC_LOGO,
    time: 'Today',
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
    time: 'Today',
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
    time: 'Yesterday',
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
    time: '2 days ago',
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
    time: 'Today',
    title: 'Watch: Highlights from today’s market wrap-up',
    image: 'https://picsum.photos/seed/market-video/400/240',
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    videoSource: 'public',
    views: 87000,
    url: 'https://example.com/news/market-wrap-video',
  },
];

export const NewsRepo = {
  fetchNews: (): Promise<NewsItem[]> =>
    new Promise(resolve => setTimeout(() => resolve(SAMPLE_NEWS), 700)),
};
