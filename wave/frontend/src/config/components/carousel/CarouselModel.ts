export type CarouselImageModel = {
  id: string;
  kind: 'image';
  image: string;
  route?: string;
};

export type CarouselVideoModel = {
  id: string;
  kind: 'video';
  thumbnail: string;
  url: string;
  // Same convention as VideoNotification (NotificationModel.ts).
  source: 'internal' | 'public';
  route?: string;
};

export type CarouselModel = CarouselImageModel | CarouselVideoModel;
