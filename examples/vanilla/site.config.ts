import type { SiteConfig } from '@landing-page-sdk/types';

export default {
  route: {
    hidden: [
      {
        route: '/about',
        site: 'bar',
        lang: 'en',
        // reason: 'test'
      }
    ]
  },
  output: {
    assetsResolution: 'rel',
  },
  sitemap: 'https://my.domain.com'
} satisfies SiteConfig;
