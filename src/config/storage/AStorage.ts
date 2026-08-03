import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

function usePersistedBoolean(key: string, defaultValue: boolean) {
  const [value, setValueState] = useState(defaultValue);

  useEffect(() => {
    AsyncStorage.getItem(key).then(stored => {
      if (stored !== null) setValueState(stored === 'true');
    });
  }, [key]);

  const setValue = (next: boolean) => {
    setValueState(next);
    AsyncStorage.setItem(key, String(next));
  };

  return [value, setValue] as const;
}

export const AStorage = {
  useOfflineMode: () => {
    const [offlineMode, setOfflineMode] = usePersistedBoolean('offlineMode', false);
    return { offlineMode, setOfflineMode };
  },
};
