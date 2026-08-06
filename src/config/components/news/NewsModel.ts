export type NewsBase = {
  id: string;
  source: string;
  sourceLogo: string;
  // ISO 8601 UTC datetime string as sent by the server (e.g.
  // "2026-08-05T09:30:00.000Z") - not pre-formatted. Tiles run this through
  // DateFormatter.smart() at render time to get the "Today"/"Yesterday"/etc.
  // display label.
  time: string;
  title: string;
  image: string;
  views: number;
  url: string;
};

export type BannerNewsItem = NewsBase & {
  kind: 'banner';
  aspectRatio?: number;
};

export type CompactNewsItem = NewsBase & {
  kind: 'compact';
};

// Named `videoSource` (not `source`) since NewsBase.source already means the
// publisher name (e.g. "CNBC TV18") - this is the video's own source type,
// matching VideoNotification's convention. `image` doubles as the poster
// thumbnail shown before playback, same as banner/compact's card image.
export type NewsVideoSourceType = 'youtube' | 'internal' | 'public';

export type VideoNewsItem = NewsBase & {
  kind: 'video';
  videoUrl: string;
  videoSource: NewsVideoSourceType;
  aspectRatio?: number;
};

export type NewsItem = BannerNewsItem | CompactNewsItem | VideoNewsItem;
