# 2. Core Concepts

### Project Config

`site.config.{js,ts}` is the control center. It drives route mode, output behavior, redirects, sitemap, and more. Details appear in later sections.

`route.mode` sets how paths map to output—out of the box with zero config:
- `tree` (default): folder-like URLs, language prefix when i18n is on.
  - `src/pages/about/me/index.html` -> `/about/me/index.html` (or `/about/me/`), with `en` -> `/en/about/me/index.html`
- `flat`: everything at root, filename encodes path (and lang).
  - `src/pages/about/me/index.html` -> `about_me.html`, with `en` -> `about_me_en.html`

Set in `site.config.{js,ts}`: `route: { mode: 'tree' | 'flat' }`.

Why two modes? `tree` fits directory-like, SEO-friendly URLs (with language prefixes). `flat` fits hosts that prefer single-level outputs or simpler deployments without directory rewrites. Choose per hosting needs.

This mapping is referenced by later stages: localization clones per lang (prefix or suffix), multi-site prefixes paths, and filtering/manifest respect the chosen mode.

### Pages

Pages use convention-based routing (similar to Nuxt/Next). They live in `src/pages/`. Each page is a directory containing:

-   `index.{html,ejs}`: HTML/template.
-   `main.{js,ts,jsx,tsx}`: JS entry.

Directory structure maps to routes (e.g., `src/pages/about/me/` -> `/about/me`) before mode/lang/site adjustments. If a page lacks `main.*`, the SDK falls back to `src/pages/main.{js,ts,jsx,tsx}` so multiple pages can share one entry (e.g., SPA-style).

### Internationalization

Add JSON files under `src/i18n/` to enable languages. SDK detects them and builds per-language pages. For example, `src/i18n/en.json` will produce `/en/**/index.html` (tree mode) or `/*_en.html` (flat mode). Access current/default lang and packs via:

-   In templates, use `lang`, `defaultLang` or `i18n`:
    ```html
    <% if (lang === defaultLang) { %>
        <h1><%= i18n.title %></h1> <!-- render only on default lang -->
    <% } %>
    ```
-   In JS, use `getPageContext` which supplied by `@landing-page-sdk/utils-browser`:
    ```js
    import { getPageContext } from '@landing-page-sdk/utils-browser';
    const { lang, defaultLang, i18n } = getPageContext();
    console.log(lang, i18n.title);
    ```

To set a default language, name a file `*.default.json` (only one default file is allowed).

### Multi-Site

Create site scripts under `src/sites/` (e.g., `site-a.ts`). The filename is the site name and becomes a URL prefix in dev.

Example: with `/about/me` and `src/sites/site-a.ts`, dev URL becomes `/site-a/about/me/` (tree mode) or `/site-a/about_me.html` (flat mode).

Once a site script exists, the SDK injects it for that site and you can read the site name via:

-   In templates, use `site`:
    ```html
    <% if (site === 'site-a') { %>
        <h1><%= i18n.title %></h1> <!-- only when site-a -->
    <% } %>
    ```
-   In JS, use `getPageContext` which supplied by `@landing-page-sdk/utils-browser`:
    ```js
    import { getPageContext } from '@landing-page-sdk/utils-browser';
    const { site } = getPageContext();
    console.log(site);
    ```

Unlike i18n, site variants produce independent sites with no implied overlap. They can be deployed separately—good for variants, A/B tests, and parallel dev.

### Page Context

Page context exposes info for the current page—filename, lang, i18n pack, site, etc. You can read it anywhere in client code; it always reflects the current page, which helps reuse logic. Example: branch by lang to run logic only for EN:

```js
import { getPageContext } from '@landing-page-sdk/utils-browser';
const { lang } = getPageContext();
if (lang === 'en') doSomething();
```
