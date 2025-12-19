# 4. Routing & Linking

### Route Config (`route`)

Configure `route.mode` in `site.config.js`:

-   `mode: 'tree'` (default): folder-like URLs with lang prefix (e.g., `/en/about/me/`).
-   `mode: 'flat'`: all pages at root, filename includes lang (e.g., `about_me_en.html`).

### Internal Links (`data-to`)

Always use `data-to` for internal links so URLs render correctly under both modes.

```html
<!-- Basic -->
<a data-to="/about/me">About</a>

<!-- Switch locale -->
<a data-to="/about/me" data-locale="ja">JA</a>
```

SDK rewrites `data-to` to the correct `href` at build time.

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

Supports string/RegExp/array (OR) and optional site/lang scoping. Hidden pages are excluded from output, manifests, and sitemap (if enabled).
***
