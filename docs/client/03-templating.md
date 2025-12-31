# 3. Templating

All `.html` and `.ejs` files are treated as EJS templates so you can embed data/logic.

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

Create reusable fragments (e.g., `header.ejs`, `footer.ejs`).

#### Include components

Use `$cmp()` to resolve component paths with EJS `include`. `$cmp()` resolves:

1. **Local components**: paths not starting with `@` resolve to `src/components/`.
  ```html
  <%- include($cmp('header.ejs')) %>
  ```

2. **Cross-project**: paths starting with `@` resolve as monorepo project paths (shared component libs).
  ```html
  <%- include($cmp('@landing-page-sdk/assets/components/my-component.ejs')) %>
  ```

#### Pass data (`_data`)

When including, pass `_data`:

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

It avoids variable shadowing. `_data` references the root template data; even if a component defines `lang`, you can still read `_data.lang` reliably.

### Component Generator

Use the component generator to scaffold component templates. Output varies by `framework`.

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
- `framework: none`: `index.ejs` + `index.ts` (or `index.js` when `useTs: false`).
- `framework: vue`: single-file component `*.vue`.
- `framework: react`: `*.tsx` (or `*.jsx` when `useTs: false`).

**Default output location:**
- If `project` is set: `${projectRoot}/${sourcePath.components}` (from `site.config`).
- Else if `path` is set: `path`.
- Else: `@landing-page-sdk/assets` project's `components/` folder.

### Static Assets

Place static assets under `public/__ASSETS__` and reference them with the `/__ASSETS__` prefix. The SDK will rewrite paths at build time based on your route/output settings:

```html
<img src="/__ASSETS__/images/logo.png" alt="logo">
```
