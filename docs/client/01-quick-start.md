# 1. Quick Start

Start by creating a new site. The generator gives you a complete structure and a working example in one go, so you can focus on content instead of scaffolding.

```bash
npx nx generate @landing-page-sdk/core:template
```

The CLI will ask for a name, path, and a few defaults, then scaffold the site for you.

### Directory Layout

A typical site looks like this. `src/pages` holds page templates and logic, `src/sites` defines site variants, and `public/__ASSETS__` is the shared entry for static assets.

```
.
|- public/
|  |- __ASSETS__/       # static assets (images, favicon, etc.)
|- src/
|  |- i18n/             # locale JSON files
|  |- pages/            # page templates & logic
|  |- sites/            # site variant scripts
|- package.json         # site package info
|- site.config.ts       # site config
|- tsconfig.json
```

### Common Commands

Day-to-day work centers around `dev`, `build`, and `preview`. They all run through Nx for consistent behavior across projects.

#### Develop

Start the dev server with HMR enabled. It prints a preview URL so you can iterate quickly.


```bash
# replace your-site-name with your project name
npx nx dev your-site-name
```

See [CLI / Nx Reference](./09-cli-nx-reference.md) for full option details.

#### Build

Use `build` when you want a deployable output. Artifacts land in `dist/` with minification and versioning applied based on your configuration.

```bash
npx nx build your-site-name
```

See [CLI / Nx Reference](./09-cli-nx-reference.md) for full option details.

#### Preview

`preview` serves the built output from `dist/` to simulate production locally. It is especially useful for validating routes, asset paths, and redirects.

```bash
npx nx preview your-site-name
```

See [CLI / Nx Reference](./09-cli-nx-reference.md) for full option details.
