# 1. Quick Start

### Create a New Site

The fastest way to start is with the built-in generator:

```bash
npx nx generate @landing-page-sdk/core:template
```

The CLI will prompt for name/path/etc. and scaffold a site with the full structure.

### Directory Layout

A typical site looks like:

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

The template ships with `dev`, `build`, and `preview` via Nx.

#### Develop

Start the dev server:

```bash
# replace your-site-name with your project name
npx nx dev your-site-name
```

The server starts with HMR and prints a preview URL.

**Options:**

-   `--host`: bind host (e.g. `--host`).
-   `--port`: port (e.g. `--port=8080`).
-   `--sites`: develop specific site variants, comma-separated (e.g. `--sites=site-a,site-b`).
-   `--config`: custom `site.config.js` path.
-   `--verbose`: verbose logging.

#### Build

Build for production:

```bash
npx nx build your-site-name
```

Outputs go to `dist/`.

**Options:**

-   `--sites`: select site variants.
-   `--config`: custom config path.
-   `--verbose`: verbose logging.

#### Preview

Preview the production build locally:

```bash
npx nx preview your-site-name
```

**Options:**

-   `--host`: bind host.
-   `--port`: port.
-   `--sites`: select site variants.
-   `--config`: custom config path.
-   `--verbose`: verbose logging.
