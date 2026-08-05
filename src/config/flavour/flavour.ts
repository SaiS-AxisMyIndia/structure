import Config from 'react-native-config';

export type Flavour = 'dev' | 'uat' | 'prod';

const BASE_URLS: Record<Flavour, string> = {
  dev: 'https://dev.api.example.com',
  uat: 'https://uat.api.example.com',
  prod: 'https://api.example.com',
};

// Public URL the app itself is hosted/deep-linked at (web build), as opposed
// to BASE_URLS above which is the backend API host.
const APP_BASE_URLS: Record<Flavour, string> = {
  dev: 'http://localhost:8080',
  // TODO: replace with the real per-flavour app URL.
  uat: 'https://uat.example.com',
  prod: 'https://app.example.com',
};

export const getFlavour = (): Flavour => (Config.APP_ENV as Flavour) || 'dev';

export const getBaseUrl = (): string => Config.API_BASE_URL || BASE_URLS[getFlavour()];

export const getAppBaseUrl = (): string => Config.WEB_BASE_URL || APP_BASE_URLS[getFlavour()];

export const isProd = (): boolean => getFlavour() === 'prod';
