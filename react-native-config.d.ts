declare module 'react-native-config' {
  export interface NativeConfig {
    APP_ENV?: 'dev' | 'uat' | 'prod';
    API_BASE_URL?: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
