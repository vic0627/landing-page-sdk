# 6. Advanced Configuration

`site.config.js` exposes rich options to customize build behavior. The sections below focus on the configuration you’ll reach for most often.

---

### Output (`output`)

Controls format, minification, and output location for build artifacts.

```javascript
// site.config.js
export default {
  output: {
    // ...
  },
};
```

**Fields:**

- `minify`: control compression.
  - `true` (default): minify HTML/JS/CSS.
  - `false`: no minify.
  - `'js'` or `['js', 'css']`: minify selected targets.

- `versioning`:
  - `'hard'` (default): hash in filename, e.g., `main-a1b2c3d4.js` (CDN-friendly).
  - `'soft'`: stable filename + query hash, e.g., `main.js?v=a1b2c3d4`.

- `assetsResolution`:
  - `'abs'` (default): absolute paths like `/__ASSETS__/img.png`.
  - `'rel'`: relative paths; deep pages rewrite to `../../__ASSETS__/img.png`.

- `threshold`: size warning threshold in bytes for media assets.

- `dist`: output directory (default `/dist`).

**Assets and `__ASSETS__` convention**

Place static assets under `public/__ASSETS__/` and reference them as `/__ASSETS__/foo.png`. Plugins rewrite to absolute or relative paths according to `assetsResolution` and apply hard/soft versioning. Using `__ASSETS__` avoids conflicts and simplifies post-build moves and cache control.

---

### Redirect (`redirect`)

Auto-detect browser language and redirect to the correct locale.

**Fields:**

- `enable` (default `true`): add a root redirect page for multi-lang sites.
- `stub` (default `false`): add per-route stubs (e.g., `/about/me` -> `/en/about/me`).
- `transform(page)`: hook to mutate redirect page DOM (JSDOM window).

**Example:**
```javascript
// site.config.js
export default {
  redirect: {
    enable: true,
    stub: true,
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

Generates `sitemap.xml` (and an index for multi-lang).

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

### API Mock (`mock`)

Powered by `vite-plugin-mock`. By default it reads from `@landing-page-sdk/assets/mock`. Set `mock: false` to disable, or point to a custom directory such as `mock: 'src/my-mocks'`.

```javascript
// site.config.js
export default {
  mock: 'src/mocks',
};
```

You can also point to a workspace path such as `mock: '@sites/project-a/mocks'`.

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

Use it in JavaScript via `import.meta.env.API_ENDPOINT` and in EJS via `<%= env.API_ENDPOINT %>`.
