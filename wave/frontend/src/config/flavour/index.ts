import AppConfig from './AppConfig';
import {brands, BrandKey} from './brands';

export const brand = AppConfig.brand as BrandKey;
export const environment = AppConfig.environment;
export const apiBaseUrl = AppConfig.apiBaseUrl;
export const appDisplayName = AppConfig.appDisplayName;
export const version = AppConfig.version;
export const buildNumber = AppConfig.buildNumber;
export const currentBrand = brands[brand];
