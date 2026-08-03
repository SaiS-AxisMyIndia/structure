import { useEffect, useState } from 'react';
import { NotificationCases } from './NotificationCases';
import { NotificationItem } from '../../../config/components/notifications/NotificationModel';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';

export function useNotificationController() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const loadingController = useLoadingController();

  const load = async () => {
    loadingController.setLoading(true);
    try {
      setNotifications(await NotificationCases.listNotifications());
      loadingController.setLoading(false);
    } catch (err) {
      loadingController.setError((err as Error).message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return { notifications, loading: loadingController.loading(), reload: load, loadingController };
}
