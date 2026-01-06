# 2. Core Concepts

### Project Config

`site.config.{js,ts}` is the control center. It defines route mode, output behavior, redirects, sitemap, and more. Later sections drill into specific options, but it helps to understand that this file shapes how the SDK interprets your project.

`route.mode` determines how paths map to output. In `tree` mode (default), the output mirrors folders, and language prefixes appear when i18n is enabled: `src/pages/about/me/index.html` becomes `/about/me/index.html` (or `/about/me/`), and `en` becomes `/en/about/me/index.html`. In `flat` mode, every page is emitted at the root and the filename encodes both the path and language, so the same file becomes `about_me.html`, and `en` becomes `about_me_en.html`.

Set it in `site.config.{js,ts}` as `route: { mode: 'tree' | 'flat' }`. Choose `tree` for directory-like, SEO-friendly URLs, and `flat` for hosts that prefer single-level outputs or simpler deployments without directory rewrites. The chosen mode flows through the entire pipeline, including i18n clones, multi-site prefixes, and the route manifest.

### Pages

Pages are convention-based (similar to Nuxt/Next) and live under `src/pages/`. Each directory uses `index.{html,ejs}` to define the output URL, and the `main.{js,ts,jsx,tsx}` file at the same level is the entry script for that page. Think of them as a pair: `index.{html,ejs}` decides the route, `main.{js,ts,jsx,tsx}` powers the page.

Example:

```
src/pages/
|- index.html
|- main.ts
|- about/
   |- index.html
   |- main.ts
   |- me/
      |- index.html
      |- main.ts
```

Output URLs (with `route.mode: 'tree'`):

- `src/pages/index.html` -> `/`
- `src/pages/about/index.html` -> `/about/`
- `src/pages/about/me/index.html` -> `/about/me/`

The `route` value is a reference derived from the `src/pages` directory structure, not the final URL by itself. The final URL is shaped by `SiteConfig.route.mode`, Internationalization, and Multi-Site. In dev mode, the site prefix lets you switch and browse variants quickly; in build output, each site is emitted into its own directory (for example, `dist/site-a/**`), so each variant can be deployed independently by hosting that directory as the site root.

The SDK also supports entry hoisting: if a page folder does not include `main.{js,ts,jsx,tsx}`, it automatically falls back to a shared entry at `src/pages/main.{js,ts,jsx,tsx}`. This is useful for SPA-style setups where multiple pages reuse one entry script.

Example:

```
src/pages/
|- main.ts            # shared entry (hoisted)
|- index.html         # page template for `/`
|- about/
   |- index.html      # page template for `/about`
```

In this structure, both `/` and `/about` will use the shared `src/pages/main.ts` entry.

### Internationalization

Drop JSON files into `src/i18n/` to enable languages. The SDK detects them and builds per-language pages. For example, `src/i18n/en.json` produces `/en/**/index.html` in tree mode or `/*_en.html` in flat mode. In templates you can read `lang`, `defaultLang`, and `i18n` directly:

```html
<% if (lang === defaultLang) { %>
  <h1><%= i18n.title %></h1> <!-- render only on default lang -->
<% } %>
```

In JavaScript, `getPageContext` from `@landing-page-sdk/utils-browser` provides the same data:

```js
import { getPageContext } from '@landing-page-sdk/utils-browser';
const { lang, defaultLang, i18n } = getPageContext();
console.log(lang, i18n.title);
```

To set the default language, name a file `*.default.json` (only one default file is allowed).

### Multi-Site

Create site scripts under `src/sites/` (for example, `site-a.ts`). The filename becomes the site name and acts as a URL prefix in dev. With a route like `/about/me` and `src/sites/site-a.ts`, the dev URL becomes `/site-a/about/me/` in tree mode or `/site-a/about_me.html` in flat mode.

Once a site script exists, the SDK injects it for that site and exposes the name. In templates, you can branch with `site`:

```html
<% if (site === 'site-a') { %>
  <h1><%= i18n.title %></h1> <!-- only when site-a -->
<% } %>
```

In JavaScript, read it with `getPageContext`:

```js
import { getPageContext } from '@landing-page-sdk/utils-browser';
const { site } = getPageContext();
console.log(site);
```

Unlike i18n, site variants are independent outputs with no implied overlap. They can be deployed separately, which is ideal for variants, A/B tests, and parallel development.

### Page Context

Page context exposes information about the current page—filename, lang, i18n pack, site, and more. You can read it anywhere in client code, and it always reflects the page being rendered. For example, branch by language to run logic only for English:

```js
import { getPageContext } from '@landing-page-sdk/utils-browser';
const { lang } = getPageContext();
if (lang === 'en') doSomething();
```
