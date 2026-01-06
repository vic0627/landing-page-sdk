# 7. Integrating SPA Frameworks

The SDK is page-first: HTML templates define pages and output routes, and your JavaScript enhances those pages. When you bring in a SPA framework like Vue, you are not replacing the routing model—you are mounting a framework app inside a page. This lets you keep static-friendly output while still using component-based UI and reactivity.

### Mount point in the page template

Your page template provides the root element for the SPA and keeps anything that belongs in the HTML shell (title, meta, assets). The Vue example uses a simple mount point and reads i18n data through EJS:

```html
<!DOCTYPE html>
<html lang="<%= lang %>">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/__ASSETS__/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title><%= i18n.title %></title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

### Bootstrap the framework in the page entry

Each page has a `main.{js,ts,jsx,tsx}` entry. In the Vue example, the entry imports the app component and mounts it to the page:

```ts
import { createApp } from 'vue';
import App from './app';

import '@/styles/main.scss';
import '@/styles/main.css';

createApp(App).mount('#app');
```

This keeps the SDK’s page structure intact while letting Vue own the interactive portion of the page.

### Add framework plugins in `site.config`

Framework support is provided through Vite plugins. The Vue example enables `@vitejs/plugin-vue` and Tailwind via the site config:

```ts
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import type { SiteConfig } from '@landing-page-sdk/types';

export default {
  plugins: [vue(), tailwindcss()],
} satisfies SiteConfig;
```

This is the entry point for integrating other SPA frameworks as well: add the relevant Vite plugin(s) and keep the rest of the SDK structure the same.

### Routing inside the SPA

Because the SDK already handles page routing and output, a full SPA router is often unnecessary for landing pages. When you need internal links that respect `tree/flat`, languages, and site variants, resolve them with the manifest utilities and wrap the logic in a framework component.

The Vue example uses a `router-link` component that calls `manifestResolver` with `getPageContext`:

```vue
<script setup lang="ts">
import { manifestResolver, getPageContext } from '@landing-page-sdk/utils-browser';
import manifest from 'virtual:route-manifest';
import { ref } from 'vue';

const href = ref('/');
const props = defineProps<{ to: string; locale?: string }>();
const { route: fromRoute, site, lang: fromLocale } = getPageContext();

href.value = manifestResolver(manifest, {
  site,
  fromLocale,
  fromRoute: fromRoute!,
  toLocale: props.locale ?? fromLocale,
  toRoute: props.to,
});
</script>

<template>
  <a :href="href"><slot /></a>
</template>
```

This keeps your component links aligned with the SDK’s routing rules.

### Use page context for i18n

The SDK exposes language packs through `getPageContext`, which you can wrap in a framework-friendly helper. In the Vue example, `use-i18n.ts` reads the pack once and returns a small translator function. This keeps the source of truth in the SDK while letting Vue consume it idiomatically.

### Where to look

For a full working reference, see `examples/vue`. The key pieces are `examples/vue/site.config.ts`, `examples/vue/src/pages/index.html`, `examples/vue/src/pages/main.ts`, and `examples/vue/src/components/router-link.vue`.
