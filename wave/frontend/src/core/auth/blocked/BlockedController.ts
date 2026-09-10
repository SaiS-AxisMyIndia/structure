import { useEffect } from 'react';
import { BackHandler } from 'react-native';
import Toast from 'react-native-simple-toast';

export function useBlockedController() {
  const onSupportPress = () => Toast.show('Support - coming soon', Toast.SHORT);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  return {
    onSupportPress,
  };
}
