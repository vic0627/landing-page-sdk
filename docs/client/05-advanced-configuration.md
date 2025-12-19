# 5. Advanced Configuration

`site.config.js` exposes rich options to customize build behavior. Key settings and examples below.

---

### Output (`output`)

Controls format/minification/path of build artifacts.

```javascript
// site.config.js
export default {
  output: {
    // ...
  },
};
```

**Fields:**

-   `minify`: control compression.
    -   `true` (default): minify HTML/JS/CSS.
    -   `false`: no minify.
    -   `'js'` or `['js', 'css']`: minify selected targets.

-   `versioning`:
    -   `'hard'` (default): hash in filename, e.g., `main-a1b2c3d4.js` (CDN-friendly).
    -   `'soft'`: stable filename + query hash, e.g., `main.js?v=a1b2c3d4`.

-   `assetsResolution`:
    -   `'abs'` (default): absolute paths like `/__ASSETS__/img.png`.
    -   `'rel'`: relative paths; deep pages rewrite to `../../__ASSETS__/img.png`.

-   `threshold`: size warning threshold in bytes for media assets.

-   `dist`: output directory (default `/dist`).

**Assets and `__ASSETS__` convention**

Place static assets under `public/__ASSETS__/` and reference as `/__ASSETS__/foo.png`. Plugins rewrite to abs/rel paths per `assetsResolution` and apply hard/soft versioning. Using `__ASSETS__` avoids conflicts and simplifies post-build moves/cache control.

---

### Redirect (`redirect`)

Auto-detect browser language and redirect to the correct locale.

**Fields:**

-   `enable` (default `true`): add a root redirect page for multi-lang sites.
-   `stub` (default `false`): add per-route stubs (e.g., `/about/me` -> `/en/about/me`).
-   `defaultLang`: fallback when detection fails.
-   `transform(page)`: hook to mutate redirect page DOM (JSDOM window).

**Example:**
```javascript
// site.config.js
export default {
  redirect: {
    enable: true,
    stub: true,
    defaultLang: 'en',
    transform(page) {
      // this === JSDOM window object
      const title = this.document.createElement('title');
      title.textContent = 'Redirecting...';
      this.document.head.appendChild(title);
    },
  },
};
```

---

### Sitemap (`sitemap`)

Generates `sitemap.xml` (and index for multi-lang).

**Basic:**

```javascript
// site.config.js
export default {
  sitemap: 'https://your-domain.com',
};
```

**Advanced:**

```javascript
// site.config.js
export default {
  sitemap: {
    enable: true,
    baseUrl: {
      default: 'https://default-site.com',
      'site-b': 'https://site-b.com',
    },
    orientation: 'dir',
    exclude: ['/private/**'],
    defaults: {
      changefreq: 'daily',
      priority: 0.7,
    },
    useAliasAsPath: false,
  },
};
```

---

### Controller (`controller`)

Inject shared scripts into targeted pages.

**Basic:**

```javascript
// site.config.js
export default {
  controller: {
    name: 'my-logic.ts', // maps to @landing-page-sdk/assets/controller/my-logic.ts
    targets: '/some-page',
  },
};
```

**Multiple controllers**

```javascript
// site.config.js
export default {
  controller: [
    {
      name: 'google-analytics',
      targets: [], // all pages
      injection: { type: 'inline', placement: 'pre' }
    },
    {
      name: 'product-page-logic',
      targets: '/product',
    }
  ]
};
```

**Advanced targets (`targets`)**

`targets` can be an object; all conditions are ANDed.

```javascript
// site.config.js
export default {
  controller: {
    name: 'my-logic.ts',
    targets: {
      routes: ['/page1', '/page2'], // inject into /page1 and /page2
      lang: ['en'],
      site: ['site-a'],
    },
  },
};
```

**Advanced injection (`injection`)**

Controls how scripts are injected.

```javascript
// site.config.js
export default {
  controller: {
    name: 'my-logic.ts',
    targets: '/some-page',
    injection: {
      type: 'inline', // 'inline': inline into HTML; 'bundle': bundle into JS (default)
      placement: 'pre', // inject before existing scripts; 'post' is default
      appendTo: 'body', // when inline, target container (default 'head')
      bundle: false, // when inline, skip bundling before inject (default true)
    },
  },
};
```

---

### API Mock (`mock`)

Powered by `vite-plugin-mock`.

-   **Default**: reads `@landing-page-sdk/assets/mock`.
-   **Disable**: `mock: false`.
-   **Custom dir**: `mock: 'src/my-mocks'`.

```javascript
// site.config.js
export default {
  mock: 'src/mocks',
  mock: '@sites/project-a/mocks',
};
```

---

### Environment Variables (`env`)

Values under `env` are injected into the client.

```javascript
// site.config.js
export default {
  env: {
    API_ENDPOINT: 'https://api.example.com',
    FEATURE_FLAG_A: true,
  },
};
```

-   **In JavaScript**: `import.meta.env.API_ENDPOINT`
-   **In EJS**: `<%%= env.API_ENDPOINT %>`

---

### Post-build & Preview

After build, SDK will:
- Copy assets per site into site-specific dirs (site distributor).
- Move `public` resources (public porter).
- Generate sitemap when enabled.

Use `npx nx preview <site>` to serve `dist/<site>` locally. Static hosting works without extra server config (no fallback/rewrites by default).

---

### DX (Mock / HMR / Page Context)

- **Mock**: default `@landing-page-sdk/assets/mock`; set to `false` or custom path.
- **HMR/Watcher**: edits to `site.config`, i18n, pages, sites trigger reload; `--verbose` for logs.
- **Page Context**: access lang/site/env/i18n via `__SDK_PAGE_CTX__.data`; `_data` available in templates.***
