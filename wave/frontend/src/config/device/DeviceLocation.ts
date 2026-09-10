import Geolocation from '@react-native-community/geolocation';
import { Permissions } from '../permission/Permissions';

export type Coordinates = {
  latitude: number;
  longitude: number;
};

// Wraps @react-native-community/geolocation behind Permissions.request so
// no caller ever reads a position without having asked for 'location'
// first - same permission-gated shape as Permissions.request('microphone')
// ahead of useVoiceSearch. Resolves null (never throws) on a denied/
// blocked permission or a failed native read, so callers can treat "no
// location" as one condition to show a retryable error for.
export const DeviceLocation = {
  getCurrentPosition: async (): Promise<Coordinates | null> => {
    const permission = await Permissions.request('location');
    if (permission !== 'granted') {return null;}

    return new Promise(resolve => {
      Geolocation.getCurrentPosition(
        position => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
      );
    });
  },
};
