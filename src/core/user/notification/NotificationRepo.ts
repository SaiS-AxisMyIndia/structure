import { NotificationItem } from '../../../config/components/notifications/NotificationModel';

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    kind: 'video',
    title: 'Need a Hospital',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'new',
    time: '2 min',
    thumbnail: 'https://picsum.photos/seed/survey-tablet/400/240',
    url: 'https://example.com/videos/need-a-hospital',
    source: 'internal',
  },
  {
    id: '2',
    kind: 'audio',
    title: 'Ayushman Hospitals',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'read',
    time: 'Now',
    audio: 'https://samplelib.com/mp3/sample-3s.mp3',
  },
  {
    id: '3',
    kind: 'banner',
    title: 'Need a Hospital',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'new',
    time: '2 min',
    image: 'https://picsum.photos/seed/hospital-building/400/240',
  },
  {
    id: '4',
    kind: 'logo',
    title: 'Ayushman Hospitals',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'read',
    time: 'Now',
    logo: 'https://picsum.photos/seed/pmjay-logo/80/80',
  },
  {
    id: '5',
    kind: 'message',
    title: 'Ayushman Hospitals',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'read',
    time: 'Now',
  },
  {
    id: '6',
    kind: 'logo',
    title: 'Ayushman Hospitals',
    status: 'new',
    time: '2 min',
    logo: 'https://picsum.photos/seed/pmjay-logo/80/80',
  },
];

export const NotificationRepo = {
  fetchNotifications: (): Promise<NotificationItem[]> =>
    new Promise(resolve => setTimeout(() => resolve(SAMPLE_NOTIFICATIONS), 2000)),
};
