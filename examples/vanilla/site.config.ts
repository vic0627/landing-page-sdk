import type { SiteConfig } from '@landing-page-sdk/types';

export default {
  route: {
    hidden: [
      {
        route: '/about',
        site: 'bar',
        lang: 'en',
        reason: '因為愛'
      }
    ]
  },
  output: {
    assetsResolution: 'rel',
  },
} satisfies SiteConfig;
