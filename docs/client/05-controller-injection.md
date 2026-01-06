# 5. Automatic Controller Injection

Controller injection lets you attach page-level scripts without touching templates or entries. The SDK resolves which pages should receive which controllers, then injects them either into the page entry (bundle mode) or directly into HTML (inline mode).

Controllers are resolved from `@landing-page-sdk/assets/controller/<name>`, so the `name` you specify maps directly to that file.

### Targeting model

Each controller defines **targets** and an **injection mode**. Targets are evaluated per page, using:

- `route`: the route reference derived from `src/pages` (not the final URL)
- `lang`: the current language (if i18n is enabled)
- `site`: the current site variant (if multi-site is enabled)

Only pages that match **all** target conditions receive the controller. Redirect pages are excluded from injection.

Default behavior is intentionally conservative: if you omit `targets`, the default route is `['/']`, so only the root page matches. To apply a controller to all routes, pass an empty route list (`routes: []`).

### Relationship patterns

Because controllers and pages are matched by targets, you can express one-to-one, one-to-many, many-to-one, and many-to-many relationships.

**One-to-one** (single controller to a single route):
```ts
export default {
  controller: {
    name: 'tracking.ts',
    targets: '/checkout',
  },
};
```

**One-to-many** (single controller to multiple routes):
```ts
export default {
  controller: {
    name: 'tracking.ts',
    targets: ['/product', '/checkout'],
  },
};
```

**Many-to-one** (multiple controllers to a single route):
```ts
export default {
  controller: [
    { name: 'tracking.ts', targets: '/checkout' },
    { name: 'analytics.js', targets: '/checkout' },
  ],
};
```

**Many-to-many** (multiple controllers across multiple routes):
```ts
export default {
  controller: [
    { name: 'tracking.ts', targets: ['/product', '/checkout'] },
    { name: 'ab-test.js', targets: ['/product', '/promo'] },
  ],
};
```

### Target conditions (route / language / site)

Use a structured target to refine injection by route, language, and site variant. All conditions are ANDed.

```ts
export default {
  controller: {
    name: 'analytics.js',
    targets: {
      routes: ['/product'],
      lang: ['en', 'zh'],
      site: ['main'],
    },
  },
};
```

To apply across all routes, set `routes: []`:

```ts
export default {
  controller: {
    name: 'global.js',
    targets: { routes: [] },
  },
};
```

### Injection modes and placement

You can inject controllers in two modes:

**Bundle (default)**  
The controller is imported into the page entry (`main.*`). Placement controls whether the import is inserted before or after existing code:

```ts
export default {
  controller: {
    name: 'tracking.ts',
    injection: { type: 'bundle', placement: 'pre' },
  },
};
```

**Inline**  
The controller is injected into HTML as a `<script>` tag. You can choose `head` or `body` and insert before or after existing content:

```ts
export default {
  controller: {
    name: 'pixel.ts',
    targets: { routes: [] },
    injection: {
      type: 'inline',
      appendTo: 'body',
      placement: 'post',
    },
  },
};
```

Inline scripts can be pre-bundled (default) or injected as raw source:

```ts
export default {
  controller: {
    name: 'critical-inline.js',
    injection: {
      type: 'inline',
      bundle: false,
    },
  },
};
```

When `bundle: true` (default), the SDK uses esbuild to bundle inline content with these defaults:

```ts
{
  minify: true,
  platform: 'browser',
  target: 'es2015',
}
```

You can override them via `injection.esbuildOptions`.
