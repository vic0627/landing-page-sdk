# 8. Configuration Reference

This section is the complete reference for `site.config.{js,ts}`. Use it alongside [Advanced Configuration](./06-advanced-configuration.md) when you need exact types, defaults, or edge-case behavior.

### Shape

The config is exported as a plain object and can be validated with the `SiteConfig` type:

```ts
import type { SiteConfig } from '@landing-page-sdk/types';

export default {
  // ...
} satisfies SiteConfig;
```

---

## `route`

Controls how pages map to output paths and how internal links are rendered. You can set a simple mode or a full option object.

```ts
route: 'tree' | 'flat'
```

```ts
route: {
  mode?: 'tree' | 'flat';
  resolution?: 'rel' | 'abs';
  orientation?: 'dir' | 'file';
  useSiteAsPath?: boolean;
  hidden?: RouteHiddenRule | RouteHiddenRule[];
}
```

Fields:
- `mode` (default: `'tree'`): route structure. `tree` mirrors folders and uses language prefixes; `flat` emits all files at root and encodes path/lang in filenames.
- `resolution` (default: `'rel'`): internal link rendering. `rel` yields relative links; `abs` yields absolute links.
- `orientation` (default: `'dir'`): directory-style vs file-style links; only effective when `mode: 'tree'`.
- `useSiteAsPath` (default: `false`): prepend site name into absolute paths.
- `hidden`: hide routes by path/site/lang.

`RouteHiddenRule`:
```ts
{
  route: string | RegExp | (string | RegExp)[];
  site?: string | string[];
  lang?: string | string[];
  reason?: string;
}
```

---

## `output`

Controls build artifacts: minification, versioning, asset paths, and output directory.

```ts
output: {
  minify?: boolean | 'html' | 'js' | 'css' | Array<'html' | 'js' | 'css'>;
  versioning?: 'hard' | 'soft';
  assetsResolution?: 'abs' | 'rel';
  threshold?: number;
  dist?: string;
}
```

Fields:
- `minify` (default: `true`): controls which targets are minified.
- `versioning` (default: `'hard'`): filename hashing vs query hash.
- `assetsResolution` (default: `'abs'`): absolute vs relative asset paths in HTML output.
- `threshold`: size warning threshold (bytes) for media assets.
- `dist` (default: `{workspaceRoot}/dist`): output directory. If you set a relative path (for example, `./dist`), it is resolved from the project root because the executor changes `cwd` to the project directory before running Vite.

---

## `redirect`

Controls language redirect page generation. Set to `false` to disable redirect pages entirely.

```ts
redirect: false | {
  enable?: boolean;
  stub?: boolean;
  defaultLang?: string; // deprecated
  transform?(this: DOMWindow, page: readonly Page): void | Promise<void>;
}
```

Fields:
- `enable` (default: `true`): generate a root redirect page for multi-lang sites.
- `stub` (default: `false`): generate per-route stubs (e.g., `/about/me` -> `/en/about/me`).
- `defaultLang` (deprecated): legacy default language value.
- `transform`: hook to mutate the redirect page DOM (JSDOM window).

---

## `sourcePath`

Overrides the default project layout.

```ts
sourcePath: {
  pages?: string;
  components?: string;
  i18n?: string;
  sites?: string;
  public?: string;
}
```

Defaults:
- `pages`: `./src/pages`
- `components`: `./src/components`
- `i18n`: `./src/i18n`
- `sites`: `./src/sites`
- `public`: `./public`

---

## `plugins`

Vite plugins for the site build. This is how SPA frameworks integrate with the SDK.

```ts
plugins: PluginOption[]
```

---

## `env`

Arbitrary environment values injected into the client.

```ts
env: Record<string, any>
```

Access it in JavaScript as `import.meta.env.KEY` and in EJS as `<%= env.KEY %>`.

---

## `controller`

Declares controller injections by route/site/lang.

```ts
controller: ControllerOption | ControllerOption[]
```

`ControllerOption`:
```ts
{
  name: string;
  targets?: string | string[] | ControllerTarget;
  injection?: 'inline' | 'bundle' | ControllerInjection;
}
```

`ControllerTarget`:
```ts
{
  routes: string | string[];
  lang?: string | string[];
  site?: string | string[];
}
```

`ControllerInjection`:
```ts
{
  type?: 'inline' | 'bundle';
  placement?: 'pre' | 'post';
  appendTo?: 'head' | 'body';
  bundle?: boolean;
  esbuildOptions?: Omit<BuildOptions, 'entryPoints' | 'bundle' | 'write' | 'plugins' | 'inject'>;
}
```

Defaults:
- `targets` default is `'/'`.
- `injection.type` default is `'bundle'`.
- `injection.placement` default is `'post'`.
- `injection.appendTo` default is `'head'` (only for inline).
- `injection.bundle` default is `true` (only for inline).

---

## `sitemap`

Controls `sitemap.xml` output. You can pass a string as the base URL or use the full option object.

```ts
sitemap: 'https://example.com' | {
  baseUrl: string | Record<string, string>;
  enable?: boolean;
  orientation?: 'file' | 'dir';
  exclude?: (string | RegExp)[];
  defaults?: { changefreq?: 'daily' | 'weekly' | 'monthly'; priority?: number };
  useSiteAsPath?: boolean;
}
```

Fields:
- `baseUrl`: base URL for sitemap entries.
- `enable` (default: `false`): enable sitemap output.
- `orientation` (default: `'file'`): file vs directory-style entries.
- `exclude`: route matchers to exclude from sitemap.
- `defaults`: default fields for sitemap entries.
- `useSiteAsPath` (default: `false`): prefix site name into sitemap URLs.

---

## `mock`

Configures API mock handlers.

```ts
mock: false | string
```

Defaults to `@landing-page-sdk/assets/mock`. Set to `false` to disable, or provide a path to a custom mock directory.
