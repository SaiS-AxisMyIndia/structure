import { NotificationItem } from '../../../config/components/notifications/NotificationModel';
import { NotificationRepo } from './NotificationRepo';

export const NotificationCases = {
  listNotifications: (): Promise<NotificationItem[]> => NotificationRepo.fetchNotifications(),
};
