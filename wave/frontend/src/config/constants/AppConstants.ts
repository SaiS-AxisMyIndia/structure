import { Flavour } from '../flavour/flavour';
import { DeviceTierValue } from '../device/DeviceTier';

export const AppConstants = {
  webviewTags: {
    policy: {
      title: 'Privacy Policy',
      // TODO: replace with the real per-flavour URL.
      url: {
        dev: 'https://storage.googleapis.com/bkt-policy-html/DPDP%20consent.html',
        uat: 'https://storage.googleapis.com/bkt-policy-html/DPDP%20consent.html',
        prod: 'https://storage.googleapis.com/bkt-policy-html/DPDP%20consent.html',
      } as Record<Flavour, string>,
    },
    terms: {
      title: 'Terms & Conditions',
      // TODO: replace with the real per-flavour URL.
      url: {
        dev: 'https://TODO-dev.example.com/terms',
        uat: 'https://TODO-uat.example.com/terms',
        prod: 'https://TODO-prod.example.com/terms',
      } as Record<Flavour, string>,
    },
    security: {
      title: 'Security',
      // TODO: replace with the real per-flavour URL.
      url: {
        dev: 'https://TODO-dev.example.com/security',
        uat: 'https://TODO-uat.example.com/security',
        prod: 'https://TODO-prod.example.com/security',
      } as Record<Flavour, string>,
    },
    acceptableUsePolicy: {
      title: 'Acceptable Use Policy',
      // TODO: replace with the real per-flavour URL.
      url: {
        dev: 'https://TODO-dev.example.com/acceptable-use-policy',
        uat: 'https://TODO-uat.example.com/acceptable-use-policy',
        prod: 'https://TODO-prod.example.com/acceptable-use-policy',
      } as Record<Flavour, string>,
    },
    udan: {
      title: 'Udan',
      url: {
        dev: 'https://web.umang.gov.in/assistive?tenantId=axismyindia.org&domain=axismyindia.org&token=a48a70c2e691113df5ea88038b2421e520bc3c8b8eb9ec792a766148602b7fad',
        uat: 'https://web.umang.gov.in/assistive?tenantId=axismyindia.org&domain=axismyindia.org&token=a48a70c2e691113df5ea88038b2421e520bc3c8b8eb9ec792a766148602b7fad',
        prod: 'https://web.umang.gov.in/assistive?tenantId=axismyindia.org&domain=axismyindia.org&token=a48a70c2e691113df5ea88038b2421e520bc3c8b8eb9ec792a766148602b7fad',
      } as Record<Flavour, string>,
    },
  },
  urls:{
    'udan': 'https://web.umang.gov.in/assistive?tenantId=axismyindia.org&domain=axismyindia.org&token=a48a70c2e691113df5ea88038b2421e520bc3c8b8eb9ec792a766148602b7fad',
    // example.com (IANA) sends no X-Frame-Options/CSP frame-ancestors restriction,
    // unlike google.com - kept here as a demo target that actually loads in a WebView.
    'example': 'https://example.com',
    'survey': 'https://web-dev.axismyindia.in/survey-ui?locale=en&id=356&flow=surveyor&auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc1N1cnZleW9yIjp0cnVlLCJzdXJ2ZXlvcl9pZCI6NzUsImlhdCI6MTc4NDExMjc1MH0.608MixKIEu5TVDK5lxhoFC2_Twgeez54hcX782VEgjM',
  },

  dummyImageUrl: 'https://images.pexels.com/photos/3926344/pexels-photo-3926344.jpeg',

  breakPoints: {
    web: 1300,
    tablet: 1100,
    mobile: 600,
  },
  maxWidth:{
    web: 1200,
    tablet: 800,
    mobile: 450,
  },

  // How many items a paginated list should request per page, by device
  // tier (see DeviceTier.ts) - a low-end device asks for fewer items per
  // fetch (less parse/render work per page), a high-end device asks for
  // more (fewer round-trips). Not wired into any controller yet - this is
  // just the per-tier number for whoever adds pagination to the search
  // controllers to read (see guide/device_performance_plan.md, point 2).
  pageSizeByTier: {
    low: 10,
    mid: 20,
    high: 30,
  } as Record<DeviceTierValue, number>,

  // Filter chip row shown above the news feed. First entry is the
  // "no filter" option - selecting it deselects every other chip.
  newsCategories: ['All', 'AMI News', 'Health', 'Agriculture', 'Environment'],

  // AsyncStorage key names, centralized here rather than as inline
  // literals at their point of use - unlike AStorage.ts's own token/user/
  // language keys (kept local to that file, since those are that module's
  // own private implementation detail), this one crosses into
  // device/DeviceStorage.ts, so it's a shared constant both files can
  // reference instead of a string that has to be kept in sync by hand.
  storageKeys: {
    // AES key DeviceStorage.ts generates once per install and persists via
    // AsyncStorage, encrypting/decrypting every file it writes/reads.
    fileEncryptionKey: 'fileStorageEncryptionKey',
    // Folder name (relative to DeviceStorage's own document directory)
    // Cacher.ts's own *Device methods namespace every cache entry under -
    // keeps cached files out of the document directory's root, separate
    // from anything else DeviceStorage.ts gets used for.
    cacheFolder: 'AMI',
  },

} as const;

export type WebviewTag = keyof typeof AppConstants.webviewTags;
