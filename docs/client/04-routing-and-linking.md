# 4. Routing & Linking

### Route Config (`route`)

As covered in [Core Concepts](./02-core-concepts.md), adjust routing via `route` in `site.config` to match hosting and SEO needs. `tree` produces directory-like URLs with language prefixes (e.g., `/en/about/me/`), while `flat` emits everything at the root with filenames that include the language (e.g., `about_me_en.html`).

- `mode: 'tree'` (default): folder-like URLs with lang prefix.
- `mode: 'flat'`: all pages at root, filename includes lang.

### Internal Links (`data-to`)

Always use `data-to` for internal links so URLs render correctly under both modes. This keeps templates mode-agnostic and avoids broken links when switching between `tree` and `flat`.

`data-to` expects a route reference that mirrors the `src/pages` folder structure, not a final URL. That means you should pass values like `/about/me` rather than concrete paths such as `/about/index.html`, `../about`, or `./about_en.html`. The SDK resolves the final URL for you based on `route.mode`, Internationalization, and Multi-Site.

```html
<!-- Basic -->
<a data-to="/about/me">About</a>

<!-- Switch locale -->
<a data-to="/about/me" data-locale="ja">JA</a>
```

SDK rewrites `data-to` to the correct `href` at build time.

### Resolve links programmatically

If you need to navigate via code, use the virtual route manifest and browser utils. `getPageContext` reads the current route/site/lang, and `manifestResolver` resolves the correct target URL based on mode, language, and site:

```js
import manifest from 'virtual:route-manifest';
import { manifestResolver, getPageContext } from '@landing-page-sdk/utils-browser';
const { site, route: fromRoute, lang: fromLocale } = getPageContext();
location.href = manifestResolver(manifest, {
  site,
  fromRoute,
  fromLocale,
  toRoute: '/about/me',
  toLocale: fromLocale,
});
```

### Link Resolution (`route.resolution`)

Controls whether rendered internal links are relative or absolute (example from `/about` to `/member/info`). Use `rel` for portable static hosting; use `abs` when you prefer canonical absolute URLs.

- `rel` (default):
  ```html
  <a href="../member/info/">To Member Info</a>
  ```
- `abs`:
  ```html
  <a href="/member/info/">To Member Info</a>
  ```

### Link Orientation (`route.orientation`)

Effective only when `route.mode: 'tree'`. It controls dir-based vs file-based links, while `flat` always uses file-based. Choose `dir` for cleaner folders, or `file` when a static host requires explicit filenames.

- `dir` (default): trailing slash, directory-style
  ```html
  <a href="/member/info/">To Member Info</a>
  ```
- `file`: explicit html target
  ```html
  <a href="/member/info/index.html">To Member Info</a>
  ```

### Base (`route.useSiteAsPath`)

A boolean flag that prepends the site name into paths (affects links and assets). It only matters for absolute paths; relative links are already site-local. This is useful when hosting multiple sites under one domain/root. For example, with `src/sites/site-a.ts` and `route.useSiteAsPath: true`:

```html
<a href="/site-a/member/info/">To Member Info</a>
```

Assets also gain the site segment:

```html
<img src="/site-a/__ASSETS__/images/logo.png" alt="logo">
```

### Hide Routes (`route.hidden`)

Hide specific routes by site/lang in `site.config.js`:

```js
export default {
  route: {
    hidden: [
      { route: '/beta', site: ['site-a'], reason: 'Site A not ready' },
      { route: /^\\/promo\\//, lang: 'ja' },
    ],
  },
};
```

Supports string/RegExp/array (OR) and optional site/lang scoping. Use this to disable variants by audience or rollout stage; hidden pages are excluded from output, manifests, and sitemap (if enabled).
