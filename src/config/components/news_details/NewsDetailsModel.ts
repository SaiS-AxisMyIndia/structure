import { CompactNewsItem } from '../news/NewsModel';

export type NewsTextBlock = {
  kind: 'text';
  id: string;
  text: string;
};

export type NewsBannerBlock = {
  kind: 'banner';
  id: string;
  image: string;
  aspectRatio?: number;
};

export type NewsVideoBlock = {
  kind: 'video';
  id: string;
  thumbnail: string;
  videoUrl: string;
  videoSource: 'youtube' | 'internal' | 'public';
  aspectRatio?: number;
};

export type NewsContentBlock = NewsTextBlock | NewsBannerBlock | NewsVideoBlock;

// Related items reuse the exact compact-card shape/visual already used in the
// news feed, just rendered in a horizontal row here.
export type RelatedNewsItem = CompactNewsItem;

export type NewsDetails = {
  id: string;
  source: string;
  sourceLogo: string;
  time: string;
  title: string;
  // Hero image shown above the title - distinct from the `blocks` body
  // content, which starts fresh below the share/views row.
  image: string;
  views: number;
  url: string;
  blocks: NewsContentBlock[];
  related: RelatedNewsItem[];
};
