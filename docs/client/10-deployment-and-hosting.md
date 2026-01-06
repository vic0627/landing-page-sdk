# 10. Deployment & Hosting

The SDK outputs a static site, so deployment is mostly about choosing URL shape, asset paths, and language handling. This guide focuses on the decisions you need to make before shipping.

### Build output and where it goes

Build artifacts are written to `{workspaceRoot}/dist` by default. You can override this with `output.dist` in `site.config.{js,ts}`. If you set a relative path (for example, `./dist`), it is resolved from the project root because the executor changes `cwd` to the project directory before running Vite.

```ts
export default {
  output: {
    dist: './dist',
  },
};
```

When you run:

```bash
npx nx build your-site-name
```

the output folder is ready to publish to any static host.

### Choose your route shape

Route shape affects both the files emitted and the URLs you’ll deploy. The SDK supports two modes:

```ts
export default {
  route: { mode: 'tree' }, // default
};
```

`tree` mirrors folders and produces URLs like `/about/me/`, which is ideal for clean, directory-style URLs. `flat` emits everything at the root and encodes the path in the filename (for example, `about_me_en.html`), which is often easier for hosts that don’t support directory rewrites.

### Serving under a subpath

If your site is hosted under a subpath (for example, `https://example.com/landing/`), pay attention to asset paths and absolute links.

- Use `output.assetsResolution: 'rel'` to emit relative asset paths that work from any depth.
- Keep `route.resolution: 'rel'` so internal links remain portable.

```ts
export default {
  route: { resolution: 'rel' },
  output: { assetsResolution: 'rel' },
};
```

If you need absolute URLs under a shared domain and multiple sites, you can also enable `route.useSiteAsPath` to prefix the site name into paths.

### Multi-site deployments

Site variants are independent outputs and can be deployed together or separately. When deploying multiple sites under the same domain, consider:

- `route.useSiteAsPath: true` to prefix each site name into its URLs.
- A hosting layout that mirrors those prefixes (for example, `/site-a/` and `/site-b/`).

This makes the built output predictable and prevents collisions between sites.

### Internationalization redirects

For multi-language sites, the SDK can generate redirect pages so the root path detects the browser language and forwards to the correct locale. Use:

```ts
export default {
  redirect: {
    enable: true,
    stub: true,
  },
};
```

`stub: true` also creates per-route stubs (for example, `/about/me` -> `/en/about/me`), which helps when your host can’t do dynamic language redirects.

### Sitemap generation

If you publish on a public domain, use the sitemap option to generate `sitemap.xml` during build. You can set a base URL directly:

```ts
export default {
  sitemap: 'https://your-domain.com',
};
```

For multi-site or multi-lang, use the full option object to set base URLs per site and customize defaults. See [Configuration Reference](./08-configuration-reference.md) for the full schema.

---

If you need to validate output locally before deploying, use:

```bash
npx nx preview your-site-name
```
