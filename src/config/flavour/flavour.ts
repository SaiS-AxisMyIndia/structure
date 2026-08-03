import Config from 'react-native-config';

export type Flavour = 'dev' | 'uat' | 'prod';

const BASE_URLS: Record<Flavour, string> = {
  dev: 'https://dev.api.example.com',
  uat: 'https://uat.api.example.com',
  prod: 'https://api.example.com',
};

export const getFlavour = (): Flavour => (Config.APP_ENV as Flavour) || 'dev';

export const getBaseUrl = (): string => Config.API_BASE_URL || BASE_URLS[getFlavour()];

export const isProd = (): boolean => getFlavour() === 'prod';
