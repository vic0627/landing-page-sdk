import type { SiteConfig } from '@landing-page-sdk/types';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [tailwindcss()],
  output: {
    assetsResolution: 'rel',
  },
} satisfies SiteConfig;
