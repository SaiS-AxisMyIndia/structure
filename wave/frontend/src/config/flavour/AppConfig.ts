import {NativeModules} from 'react-native';

export type AppConfigShape = {
  brand: string;
  environment: string;
  apiBaseUrl: string;
  appDisplayName: string;
  version: string;
  buildNumber: string;
};

const {AppConfig} = NativeModules as {AppConfig: AppConfigShape};

export default AppConfig;
