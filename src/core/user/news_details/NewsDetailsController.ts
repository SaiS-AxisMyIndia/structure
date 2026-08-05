import { useEffect, useState } from 'react';
import { Share } from 'react-native';
import { NewsDetailsCases } from './NewsDetailsCases';
import { NewsDetails } from '../../../config/components/news_details/NewsDetailsModel';
import { useLoadingController } from '../../../config/components/layouts/LoadingView';
import { Routes } from '../../../config/routes/registry';

function share(title: string, url: string) {
  Share.share({ message: title, url }).catch(() => {});
}

export function useNewsDetailsController(id: string) {
  const [details, setDetails] = useState<NewsDetails | null>(null);
  const loadingController = useLoadingController();

  const onSharePress = () => {
    if (!details) return;
    share(details.title, Routes.user.newsDetails.shareUrl({ id: details.id }));
  };

  const load = async () => {
    loadingController.setLoading(true);
    try {
      setDetails(await NewsDetailsCases.getDetails(id));
      loadingController.setLoading(false);
    } catch (err) {
      loadingController.setError((err as Error).message);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  return {
    details,
    loading: loadingController.loading(),
    reload: load,
    onSharePress,
    loadingController,
  };
}
