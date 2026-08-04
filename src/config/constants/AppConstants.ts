import { Flavour } from '../flavour/flavour';

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
    "udan": "https://web.umang.gov.in/assistive?tenantId=axismyindia.org&domain=axismyindia.org&token=a48a70c2e691113df5ea88038b2421e520bc3c8b8eb9ec792a766148602b7fad",
    // example.com (IANA) sends no X-Frame-Options/CSP frame-ancestors restriction,
    // unlike google.com - kept here as a demo target that actually loads in a WebView.
    "example": "https://example.com",
    "survey": "https://web-dev.axismyindia.in/survey-ui?locale=en&id=356&flow=surveyor&auth=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc1N1cnZleW9yIjp0cnVlLCJzdXJ2ZXlvcl9pZCI6NzUsImlhdCI6MTc4NDExMjc1MH0.608MixKIEu5TVDK5lxhoFC2_Twgeez54hcX782VEgjM"
  },

  breakPoints: {
    web: 1200,
    tablet: 900,
    mobile: 600,
  },
  maxWidth:{
    web: 1100,
    tablet: 800,
    mobile: 450,
  }

} as const;

export type WebviewTag = keyof typeof AppConstants.webviewTags;
