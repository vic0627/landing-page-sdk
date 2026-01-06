# 3. Templating

All `.html` and `.ejs` files are treated as EJS templates, which means you can embed data and logic directly in markup without switching formats.

### Template Variables

Available in templates:

- `i18n`: current language pack from `src/i18n/`.
- `i18nPack`: all language packs.
- `lang`: current language code.
- `defaultLang`: default language code.
- `langs`: all supported languages.
- `site`: current site name.
- `env`: environment vars from `site.config.js`.
- `route`: route reference for the page.
- `filename`: output filename.
- `$cmp`: helper to resolve EJS component paths.
- `_data`: reference to the root data object (pass to components).

**Example:**
```html
<h1><%= i18n.title %></h1>
<p>Current language: <%= lang %></p>
<% if (site === 'site-a' && lang === 'en') { %>
  <p>Only visible on site-a in EN</p>
<% } %>
```

### Components (`$cmp`)

Create reusable fragments such as `header.ejs` or `footer.ejs`, then include them through `$cmp()` so paths resolve consistently. For local components, use a path without `@` and it will resolve to `src/components/`:

```html
<%- include($cmp('header.ejs')) %>
```

For cross-project usage, prefix the path with `@` to resolve through the monorepo (shared component libraries):

```html
<%- include($cmp('@landing-page-sdk/assets/components/my-component.ejs')) %>
```

#### Pass data (`_data`)

When including components, pass `_data` to preserve the full root context:

```html
<body>
  <%- include($cmp('header.ejs'), _data) %>

  <main>
    <!-- Page content -->
  </main>

  <%- include($cmp('footer.ejs'), _data) %>
</body>
```

**Why `_data`?**

It avoids variable shadowing. `_data` always points at the root template data, so even if a component defines `lang`, you can still access `_data.lang` reliably.

### Component Generator

Use the component generator to scaffold component templates. Output varies by `framework`, but the generator keeps the structure consistent across sites.

```bash
npx nx g @landing-page-sdk/core:component
```

**Options:**
- `name` (required): component name. Must start with a letter, and can include letters, numbers, and `-`.
- `framework`: `none` (default), `vue`, or `react` to pick the component template set.
- `useTs`: when false, generated files are converted to JS/JSX.
- `project`: target Nx project (must be an application). When set, the generator resolves the component folder from the project's `site.config.{js,ts}` `sourcePath.components`.
- `path`: explicit output path. Overrides the project path if provided.

**What gets generated:**

For `framework: none`, you get `index.ejs` with `index.ts` (or `index.js` when `useTs: false`). For `framework: vue`, you get a single-file `*.vue`. For `framework: react`, you get `*.tsx` (or `*.jsx` when `useTs: false`).

**Default output location:**

If `project` is set, output goes to `${projectRoot}/${sourcePath.components}` from `site.config`. If `path` is set, it uses that directly. Otherwise, it falls back to the `@landing-page-sdk/assets` project's `components/` folder.

### Static Assets

Place static assets under `public/__ASSETS__` and reference them with the `/__ASSETS__` prefix. The SDK rewrites paths at build time based on your route/output settings, so the same markup works across different modes:

```html
<img src="/__ASSETS__/images/logo.png" alt="logo">
```
