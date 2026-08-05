import { NewsDetails, RelatedNewsItem } from '../../../config/components/news_details/NewsDetailsModel';

const CNBC_LOGO = 'https://picsum.photos/seed/cnbc-logo/80/80';

const RELATED: RelatedNewsItem[] = [
  {
    id: 'r1',
    kind: 'compact',
    source: 'CNBC TV18',
    sourceLogo: CNBC_LOGO,
    time: 'Today',
    title: 'Markets end higher led by IT and banking stocks',
    image: 'https://picsum.photos/seed/related-1/200/200',
    views: 54000,
    url: 'https://example.com/news/markets-higher',
  },
  {
    id: 'r2',
    kind: 'compact',
    source: 'CNBC TV18',
    sourceLogo: CNBC_LOGO,
    time: 'Today',
    title: 'Rupee gains against dollar as crude oil prices ease',
    image: 'https://picsum.photos/seed/related-2/200/200',
    views: 31000,
    url: 'https://example.com/news/rupee-gains',
  },
  {
    id: 'r3',
    kind: 'compact',
    source: 'CNBC TV18',
    sourceLogo: CNBC_LOGO,
    time: 'Yesterday',
    title: 'Global tech stocks rally after strong earnings season',
    image: 'https://picsum.photos/seed/related-3/200/200',
    views: 18500,
    url: 'https://example.com/news/tech-rally',
  },
  {
    id: 'r4',
    kind: 'compact',
    source: 'CNBC TV18',
    sourceLogo: CNBC_LOGO,
    time: 'Yesterday',
    title: 'RBI holds repo rate steady in latest monetary policy review',
    image: 'https://picsum.photos/seed/related-4/200/200',
    views: 62000,
    url: 'https://example.com/news/rbi-repo-rate',
  },
];

const DEFAULT_DETAILS: NewsDetails = {
  id: '1',
  source: 'CNBC TV18',
  sourceLogo: CNBC_LOGO,
  time: 'Today',
  title: "Trump floods social media with AI images targeting rivals and promoting 'Trump 2028' | In pics",
  image: 'https://picsum.photos/seed/breaking-news/800/450',
  views: 200000,
  url: 'https://example.com/news/trump-ai-images',
  blocks: [
    {
      kind: 'text',
      id: 'b1',
      text:
        'Over the past few weeks, US President Donald Trump has ramped up posting AI-generated images and videos ' +
        'on his social media accounts, targeting political rivals while promoting the idea of a "Trump 2028" ' +
        'campaign, despite constitutional term limits barring a third term.',
    },
    {
      kind: 'banner',
      id: 'b2',
      image: 'https://picsum.photos/seed/details-banner-1/800/450',
    },
    {
      kind: 'text',
      id: 'b3',
      text:
        'The images, shared across multiple platforms, have been amplified by supporters and criticised by ' +
        'opponents as misleading. Several fact-checking organisations have flagged the posts as AI-generated ' +
        'and lacking factual basis.',
    },
    {
      kind: 'video',
      id: 'b4',
      thumbnail: 'https://picsum.photos/seed/details-video/800/450',
      videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
      videoSource: 'public',
    },
    {
      kind: 'text',
      id: 'b5',
      text:
        'Analysts note this is part of a broader trend of political figures worldwide using AI-generated media ' +
        'to shape public narrative, raising fresh questions around platform moderation policies.',
    },
    {
      kind: 'banner',
      id: 'b6',
      image: 'https://picsum.photos/seed/details-banner-2/800/450',
    },
  ],
  related: RELATED,
};

export const NewsDetailsRepo = {
  fetchDetails: (id: string): Promise<NewsDetails> =>
    new Promise(resolve => setTimeout(() => resolve({ ...DEFAULT_DETAILS, id }), 700)),
};
