import { apiBaseUrl, brand, environment } from './index';
import { BrandKey } from './brands';

export type Flavour = 'dev' | 'uat' | 'prod';

const BASE_URLS: Record<Flavour, string> = {
  dev: 'https://api-whitelabel-dev.axismyindia.in',
  uat: 'https://api-whitelabel-dev.axismyindia.in',
  prod: 'https://api.example.com',
};

const APP_BASE_URLS: Record<BrandKey, Record<Flavour, string>> = {
  IN: {
    dev: 'https://dev.axismyindia.in',
    uat: 'https://uat.example.com',
    prod: 'https://app.example.com',
  },
  US: {
    dev: 'http://localhost:4040',
    uat: 'https://uat.example.com',
    prod: 'https://app.example.com',
  },
  RU: {
    dev: 'http://localhost:4040',
    uat: 'https://uat.example.com',
    prod: 'https://app.example.com',
  },
};

const IMAGE_BASE_URLS: Record<Flavour, string> = {
  dev: 'https://dev.images.example.com',
  uat: 'https://uat.images.example.com',
  prod: 'https://images.example.com',
};

export const Flavour = {
  value: ()=> getEnvironment(),
  getBaseUrl: (): string => apiBaseUrl || BASE_URLS[getEnvironment()],
  getAppBaseUrl: (): string => APP_BASE_URLS[brand][getEnvironment()],
  getImageBaseUrl: (): string => IMAGE_BASE_URLS[getEnvironment()],
  isProd: (): boolean => getEnvironment() === 'prod',
  isUat: (): boolean => getEnvironment() === 'uat',
  isDev: (): boolean => getEnvironment() === 'dev',
};

export const getEnvironment = (): Flavour => (environment?.toLowerCase() as Flavour) || 'dev';


