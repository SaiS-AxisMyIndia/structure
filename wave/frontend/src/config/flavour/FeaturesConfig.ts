import { Flavour, getEnvironment } from './flavour';

export type AppFeatures = {
  showWalkThroughs: boolean;
  walkThroughTesting: boolean;
  encryptFileStorage: boolean;
  // Gates secure_call.ts's own console logging of every request/response
  // (method, url, headers, payload) - this RN version's bundled DevTools
  // has no Network panel of its own, so this stands in for one. On in
  // dev/uat, off in prod, independent of __DEV__ so it can be flipped
  // without a debug-vs-release rebuild.
  networkDebug: boolean;
};

const FEATURES: Record<Flavour, AppFeatures> = {
  dev: {
    showWalkThroughs: true,
    walkThroughTesting: true,
    encryptFileStorage: false,
    networkDebug: true,
  },
  uat: {
    showWalkThroughs: true,
    walkThroughTesting: false,
    encryptFileStorage: true,
    networkDebug: true,
  },
  prod: {
    showWalkThroughs: true,
    walkThroughTesting: false,
    encryptFileStorage: true,
    networkDebug: false,
  },
};

export const FeaturesConfig: AppFeatures = FEATURES[getEnvironment()];
