import { Platform } from 'react-native';
import RNDeviceInfo, { DeviceType, PowerState } from 'react-native-device-info';

export type DeviceDetails = {
  brand: string;
  model: string;
  manufacturer: string;
  deviceName: string;
  deviceType: DeviceType;
  systemName: string;
  systemVersion: string;
  uniqueId: string;
  isTablet: boolean;
  isEmulator: boolean;
};

export type DeviceStorageInfo = {
  freeBytes: number;
  totalBytes: number;
  freeGB: number;
  totalGB: number;
  // 0-100, share of total disk space already used - (total - free) / total,
  // what SettingsSPage.tsx's "Device Storage" ring displays.
  usedPercentage: number;
};

export type DeviceMemoryInfo = {
  // This app's own memory footprint, in bytes - NOT whole-device memory
  // usage. getUsedMemory() reports the calling app's process usage on both
  // iOS and Android (see react-native-device-info's own docs on
  // getUsedMemory - it points at Android's ActivityManager
  // .getProcessMemoryInfo, a per-process number, and iOS has no API for
  // system-wide usage at all), so this is "how much RAM this app is using",
  // not "how full the device's RAM is". `totalBytes`/`totalGB` below are
  // real whole-device RAM though (DeviceTier.ts's own signal) - only the
  // "used" half is app-scoped.
  appUsedBytes: number;
  totalBytes: number;
  appUsedGB: number;
  totalGB: number;
  // 0-100, this app's usage as a share of total device RAM - not overall
  // device memory pressure (see appUsedBytes above).
  appUsedPercentage: number;
};

export type DeviceBatteryInfo = {
  // 0-1, -1 if the platform can't report it.
  level: number;
  isCharging: boolean;
  batteryState: PowerState['batteryState'];
  lowPowerMode: boolean;
};

const BYTES_PER_GB = 1024 ** 3;

// Wraps react-native-device-info, kept to the handful of fields this app
// actually surfaces (SettingsSPage.tsx's "Device Mapped"/"Device Storage"
// cards, DeviceTier.ts's own RAM read) rather than every field the library
// exposes - same one-capability-per-file, small-surface convention as
// Permissions.ts. App version/build number are NOT here - those already
// come from the app's own native config module (see utils/AppVersion.ts /
// flavour/), not from device-info. getMemoryInfo/getBatteryInfo below used
// to be their own files (DeviceMemory.ts/DeviceBattery.ts) - folded back
// in here since all four calls are still just read-only device *info*,
// same underlying library, same one-capability-*module* this file already
// is; DeviceStorage.ts (sibling file, same folder) is the distinct
// concern of actually writing to disk, not just reading info about it.
//
// react-native-device-info resolves its own web polyfill internally
// (Platform.OS === 'web') - every call below is safe cross-platform
// without a .web.ts shim of our own.
export const DeviceInfo = {
  // A standalone read of just the unique device identifier -
  // getUniqueId() is the same call getDetails() already makes as part of
  // its own Promise.all, but a caller that only needs the id itself (e.g.
  // ApiSheet.user.generateOtp's own `deviceId` field) shouldn't have to
  // pay for manufacturer/deviceName/isEmulator too just to get it.
  // Vendor/IDFV on iOS, ANDROID_ID (falls back to an app-generated UUID
  // persisted in shared prefs on API 26- ) on Android - stable for this
  // install, per react-native-device-info's own docs; it is not a
  // hardware serial and can change on a factory reset or app reinstall.
  getDeviceId: (): Promise<string> => RNDeviceInfo.getUniqueId(),

  // Same standalone-read reasoning as getDeviceId() above - LoginRepo's
  // own verify-otp call (sent as the `x-device-name` header, not the
  // body - see AuthController.validateOtp on the backend) just needs the
  // name, not the rest of getDetails()'s Promise.all.
  getDeviceName: (): Promise<string> => RNDeviceInfo.getDeviceName(),

  getDetails: async (): Promise<DeviceDetails> => {
    const [manufacturer, deviceName, uniqueId, isEmulator] = await Promise.all([
      RNDeviceInfo.getManufacturer(),
      RNDeviceInfo.getDeviceName(),
      RNDeviceInfo.getUniqueId(),
      RNDeviceInfo.isEmulator(),
    ]);

    return {
      brand: RNDeviceInfo.getBrand(),
      model: RNDeviceInfo.getModel(),
      manufacturer,
      deviceName,
      // getDeviceType() is typed just `string` by the library itself even
      // though it only ever returns one of DeviceType's members - narrowing
      // here so callers get the real union instead of a bare string.
      deviceType: RNDeviceInfo.getDeviceType() as DeviceType,
      systemName: RNDeviceInfo.getSystemName(),
      systemVersion: RNDeviceInfo.getSystemVersion(),
      uniqueId,
      isTablet: RNDeviceInfo.isTablet(),
      isEmulator,
    };
  },

  getStorageInfo: async (): Promise<DeviceStorageInfo> => {
    // On web, react-native-device-info's own polyfill answers these two
    // calls with navigator.storage.estimate()'s quota/usage - the
    // browser's per-origin storage allowance, not the phone's real free
    // disk space (there is no web API for that at all - browsers don't
    // expose it, for privacy). Surfacing that number dressed as "device
    // storage" would look real but be meaningless, so this asks for it
    // only where it actually is real: iOS/Android. SettingsSController.ts
    // catches this and shows the rest of the page regardless (same
    // treatment as a failed profile fetch).
    if (Platform.OS === 'web') {
      throw new Error('Device storage is only available on iOS/Android.');
    }

    const [freeBytes, totalBytes] = await Promise.all([
      RNDeviceInfo.getFreeDiskStorage(),
      RNDeviceInfo.getTotalDiskCapacity(),
    ]);

    return {
      freeBytes,
      totalBytes,
      freeGB: freeBytes / BYTES_PER_GB,
      totalGB: totalBytes / BYTES_PER_GB,
      usedPercentage: totalBytes > 0 ? ((totalBytes - freeBytes) / totalBytes) * 100 : 0,
    };
  },

  getMemoryInfo: async (): Promise<DeviceMemoryInfo> => {
    const [appUsedBytes, totalBytes] = await Promise.all([
      RNDeviceInfo.getUsedMemory(),
      RNDeviceInfo.getTotalMemory(),
    ]);

    return {
      appUsedBytes,
      totalBytes,
      appUsedGB: appUsedBytes / BYTES_PER_GB,
      totalGB: totalBytes / BYTES_PER_GB,
      appUsedPercentage: totalBytes > 0 ? (appUsedBytes / totalBytes) * 100 : 0,
    };
  },

  // One getPowerState() call covers level + charging state + low-power
  // mode in a single native round-trip, instead of the separate
  // getBatteryLevel()/isBatteryCharging() calls the library also exposes.
  getBatteryInfo: async (): Promise<DeviceBatteryInfo> => {
    const state = await RNDeviceInfo.getPowerState();

    return {
      level: state.batteryLevel ?? -1,
      isCharging: state.batteryState === 'charging' || state.batteryState === 'full',
      batteryState: state.batteryState ?? 'unknown',
      lowPowerMode: state.lowPowerMode ?? false,
    };
  },
};
