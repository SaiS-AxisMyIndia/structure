import { Linking, PermissionsAndroid, Platform } from 'react-native';
import ReactNativeBiometrics from 'react-native-biometrics';
import notifee, { AuthorizationStatus } from '@notifee/react-native';
import Geolocation from '@react-native-community/geolocation';

// Kept deliberately small - one entry per permission this app actually
// requests, not a generic wrapper around every OS permission. Add to this
// union (and to `Permissions` below) as new native capabilities need one.
export type PermissionKind = 'microphone' | 'storage' | 'biometric' | 'notifications' | 'location';

export type PermissionResult =
  | 'granted'
  // User said no this time - asking again through the OS prompt is still
  // possible.
  | 'denied'
  // Android "don't ask again" / iOS previously denied - the OS won't show
  // its own prompt anymore, so the only way forward is Settings.
  | 'blocked';

async function requestMicrophone(): Promise<PermissionResult> {
  if (Platform.OS !== 'android') {
    // iOS has no JS-level permission check without pulling in a native
    // permissions module (react-native-permissions etc.) - AVAudioSession /
    // SFSpeechRecognizer show their own system prompt the first time
    // they're used instead. Report "granted" here and let the actual
    // start() call fail (handled by the caller) if the user has denied it,
    // at which point openSettings() below is the only way to recover.
    return 'granted';
  }

  const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  if (already) {
    return 'granted';
  }

  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Microphone Permission',
    message: 'Allow microphone access to search by voice.',
    buttonPositive: 'Allow',
    buttonNegative: 'Deny',
  });

  if (result === PermissionsAndroid.RESULTS.GRANTED) {return 'granted';}
  if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {return 'blocked';}
  return 'denied';
}

// DeviceStorage.ts only ever writes to the app's own private document
// directory (RNFS.DocumentDirectoryPath - Android's getFilesDir()
// equivalent, iOS's app sandbox) - neither platform requires a runtime
// permission grant for an app to read/write its own private storage, only
// for reaching *outside* it (shared/external storage, e.g. saving to the
// public Downloads folder, which this app doesn't do). So this is a real
// permission *check point* for DeviceStorage.ts's callers to go through,
// not a no-op stub - if this app ever starts writing to shared/external
// storage instead, the real PermissionsAndroid.request(WRITE_EXTERNAL_
// STORAGE) flow belongs right here. For private storage there's genuinely
// nothing to ask the OS for, so this always resolves 'granted'.
async function requestStorage(): Promise<PermissionResult> {
  return 'granted';
}

// One shared instance - createKeys/deleteKeys aren't used here (this file
// only ever confirms the user's identity in the moment, it doesn't sign
// anything), so `allowDeviceCredentials: true` just means a device PIN/
// pattern/password satisfies the prompt too, not only Face ID/fingerprint
// itself - the same "any of the OS's own configured auth factors" default
// most apps want for a non-payment confirmation.
const biometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

async function requestBiometric(): Promise<PermissionResult> {
  const { available } = await biometrics.isSensorAvailable();
  if (!available) {
    // No biometric hardware, or hardware present but nothing enrolled
    // (no fingerprint/face registered) - either way there is nothing for
    // a JS-level retry to change; only the device's own Settings (or its
    // enrollment flow) can fix this, same 'blocked' meaning used
    // elsewhere in this file.
    return 'blocked';
  }

  // isSensorAvailable() only confirms the sensor exists and is enrolled -
  // it does not itself ask the user for anything. The actual "permission"
  // here is granted the moment the user successfully clears this prompt,
  // so requesting it and confirming identity are the same step.
  const { success } = await biometrics.simplePrompt({ promptMessage: 'Confirm your identity' });
  return success ? 'granted' : 'denied';
}

async function requestNotifications(): Promise<PermissionResult> {
  // On Android <13 this resolves AUTHORIZED immediately with no OS prompt
  // at all (POST_NOTIFICATIONS didn't exist as a runtime permission
  // before API 33) - requestPermission() already knows this per-platform,
  // same one-call-covers-both-platforms convention DeviceInfo.ts's own
  // getPowerState() call uses.
  const settings = await notifee.requestPermission();
  if (
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL
  ) {
    return 'granted';
  }
  // Notifee's own settings object has no distinct "can't ask again"
  // signal the way PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN does for
  // requestMicrophone/requestLocation below - every refusal reports as
  // this same 'denied', openSettings() is the fallback path regardless.
  return 'denied';
}

async function requestLocation(): Promise<PermissionResult> {
  if (Platform.OS === 'android') {
    const already = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    if (already) {
      return 'granted';
    }

    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
      title: 'Location Permission',
      message: 'Allow location access to find services and content near you.',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });

    if (result === PermissionsAndroid.RESULTS.GRANTED) {return 'granted';}
    if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {return 'blocked';}
    return 'denied';
  }

  if (Platform.OS === 'web') {
    return 'granted';
  }

  return new Promise(resolve => {
    Geolocation.requestAuthorization(
      () => resolve('granted'),
      () => resolve('denied'),
    );
  });
}

export const Permissions = {
  request: (kind: PermissionKind): Promise<PermissionResult> => {
    switch (kind) {
      case 'microphone':
        return requestMicrophone();
      case 'storage':
        return requestStorage();
      case 'biometric':
        return requestBiometric();
      case 'notifications':
        return requestNotifications();
      case 'location':
        return requestLocation();
    }
  },
  // Android sends the user to the app's own settings screen; iOS's
  // Linking.openURL(openSettingsURL) equivalent is openSettings() itself as
  // of RN 0.68+, so this is cross-platform via one RN core API - no extra
  // native permissions package needed just to deep-link to Settings.
  openSettings: (): Promise<void> => Linking.openSettings(),
};
