export type NotificationStatus = 'new' | 'read';

export type NotificationBase = {
  id: string;
  title: string;
  description?: string;
  status: NotificationStatus;
  time: string;
  onPress?: () => void;
};

export type BannerNotification = NotificationBase & {
  kind: 'banner';
  image: string;
};

export type VideoNotification = NotificationBase & {
  kind: 'video';
  thumbnail: string;
  url: string;
  source: 'youtube' | 'internal' | 'public';
};

export type ImageNotification = NotificationBase & {
  kind: 'image';
  thumbnail: string;
};

export type LogoNotification = NotificationBase & {
  kind: 'logo';
  logo: string;
};

export type MessageNotification = NotificationBase & {
  kind: 'message';
};

export type AudioNotification = NotificationBase & {
  kind: 'audio';
  audio: string;
};

export type NotificationItem =
  | BannerNotification
  | VideoNotification
  | ImageNotification
  | LogoNotification
  | MessageNotification
  | AudioNotification;
