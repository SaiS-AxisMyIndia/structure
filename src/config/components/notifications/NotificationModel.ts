export type NotificationStatus = 'new' | 'read';

export type NotificationBase = {
  id: string;
  title: string;
  description?: string;
  status: NotificationStatus;
  // ISO 8601 UTC datetime string as sent by the server, not pre-formatted -
  // run through DateFormatter.smart() at render time. See NewsBase.time.
  time: string;
  // Where tapping this notification should go - passed straight to
  // Routes.deepLink(), so it can be a plain route path, an `<Internal>`
  // webview URL, or an `<External>` URL. Comes from the repo/API.
  route?: string;
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
