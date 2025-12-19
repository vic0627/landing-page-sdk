import vue from '@vitejs/plugin-vue';

import tailwindcss from '@tailwindcss/vite';

import type { SiteConfig } from '@landing-page-sdk/types';

export default {
  plugins: [vue(), tailwindcss()],
} satisfies SiteConfig;
