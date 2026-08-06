import { NotificationItem } from '../../../config/components/notifications/NotificationModel';

// Stands in for the server's UTC timestamp on each item - see NewsRepo.ts.
// DateFormatter.smart() only has day-level granularity, so minute-fresh
// items ('2 min'/'Now') collapse to "just now" (i.e. isoDaysAgo(0) ->
// renders as 'Today') like everything else from today.
const isoDaysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    kind: 'video',
    title: 'Need a Hospital',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'new',
    time: isoDaysAgo(0),
    thumbnail: 'https://picsum.photos/seed/survey-tablet/400/240',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    source: 'public',
    route: '/user/services',
  },
    {
    id: '7',
    kind: 'video',
    title: 'Need a Hospital',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'new',
    time: isoDaysAgo(0),
    thumbnail: 'https://picsum.photos/seed/survey-tablet2/400/240',
    url: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    source: 'public',
    route: '/user/services',
  },
  {
    id: '8',
    kind: 'video',
    title: 'Need a Hospital',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'new',
    time: isoDaysAgo(0),
    thumbnail: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
    url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
    source: 'youtube',
    route: '<External>https://www.youtube.com/watch?v=aqz-KE-bpKQ',
  },
  {
    id: '2',
    kind: 'audio',
    title: 'Ayushman Hospitals',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'read',
    time: isoDaysAgo(0),
    audio: 'https://samplelib.com/mp3/sample-3s.mp3',
    route: '/user/schemes',
  },
  {
    id: '3',
    kind: 'banner',
    title: 'Need a Hospital',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'new',
    time: isoDaysAgo(0),
    image: 'https://picsum.photos/seed/hospital-building/400/240',
    route: '/user/services',
  },
  {
    id: '4',
    kind: 'logo',
    title: 'Ayushman Hospitals',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'read',
    time: isoDaysAgo(0),
    logo: 'https://picsum.photos/seed/pmjay-logo/80/80',
    route: '/user/schemes',
  },
  {
    id: '5',
    kind: 'message',
    title: 'Ayushman Hospitals',
    description: 'Find near by hospitals accepting Ayushman Bharat Card',
    status: 'read',
    time: isoDaysAgo(0),
    route: '/user/schemes',
  },
  {
    id: '6',
    kind: 'logo',
    title: 'Ayushman Hospitals',
    status: 'new',
    time: isoDaysAgo(0),
    logo: 'https://picsum.photos/seed/pmjay-logo/80/80',
    route: '/user/schemes',
  },
];

export const NotificationRepo = {
  fetchNotifications: (): Promise<NotificationItem[]> =>
    new Promise(resolve => setTimeout(() => resolve(SAMPLE_NOTIFICATIONS), 700)),
};
