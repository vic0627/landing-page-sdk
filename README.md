<h1 align="center">
Landing Page SDK
</h1>

<p align="center">
  A powerful, Vite-powered SDK for building and managing high-performance landing pages.
</p>

---

## Documentation

-   [Client Documentation](./docs/client/README.md)
-   [Developer Documentation](./docs/dev/README.md)

## Features

-   ⚡️ **Vite Powered:** Enjoy lightning-fast development with instant server start and Hot Module Replacement (HMR).
-   🏗️ **Multi-Site Architecture:** Manage landing pages (LPs) for multiple brands or campaigns within a single codebase.
-   📄 **Multi-Page Application (MPA):** Built-in support for constructing traditional multi-page applications.
-   🎭 **Site Variants:** Generate multiple output versions for a single landing page based on different configurations or target audiences.
-   🚀 **Interactive Scaffolding:** Provides interactive commands to quickly generate complete structures for new sites.
-   💉 **Automated Injection:** Automatically injects necessary scripts and styles into pages without manual management.
-   📦 **Optimized Build:** Automatically bundles necessary resources for each site, ensuring minimal bundle size and faster load times.
-   🔧 **Easy Configuration:** Easily configure sites, pages, and redirects via simple JavaScript configuration files.
-   🌍 **Internationalization (i18n):** Built-in support for multi-language content localization.
-   🔌 **Extensible Core:** Flexible plugin and executor system allowing for custom extensions and integrations.

## Project Structure

This repository is managed via an Nx monorepo.

```
.
|- .core/             # Core SDK logic, Vite plugins, utilities, assets, templates
|- docs/              # Documentation (client/dev/share)
|- example/           # Example site to try the SDK
|- dist/              # Build output
|- executors.json     # Nx executor registration
|- generators.json    # Nx generator registration
|- nx.json            # Nx workspace configuration
|- package.json       # Root package configuration
```

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (LTS version recommended)

### Installation

1.  Clone this repository.

2.  Install dependencies in the project root:
    ```bash
    npm install
    ```

### Create a New Site

This project provides a code generator to quickly create a new site.

Run the following command to start the generator:

```bash
npx nx g @landing-page-sdk/core:template
```

Upon execution, the system will prompt you for the following information:
-   **Project Name (name):** The name of the new site (e.g., `my-new-site`).
-   **Project Path (path):** The path for the new site (e.g., `landing-page/my-new-site`).
-   **Route Mode (routeMode):** The routing mode to use for the site (`tree` or `flat`).
-   **Use TypeScript (useTs):** Whether to use TypeScript (yes/no).
-   **Framework (framework):** The framework to use for the site (`vue`, `react`, or `none`).
-   **Style Processor (style):** The style processor to use for the site (`tailwindcss`, `sass`, or `none`).

Once completed, the new site `my-new-site` will be created in the `landing-page/my-new-site` directory, containing all necessary configuration files and basic example pages.

### Install Packages for Sub-projects

To install additional packages for a specific site (sub-project), use `npm install` with the `--workspace` argument in the **project root**.

```bash
npm install <package-name> --workspace=<project-name>
```

**Important:** Do NOT run `npm install` directly inside a sub-project directory. This will cause packages to be incorrectly installed in the root `package.json`, affecting the stability of the entire monorepo.

### Development Mode

To start the development server for a specific site, use the `nx dev` command. For example, to start the `my-new-site` project:

```bash
npx nx dev my-new-site
```

The server will start, and you can view your website in the browser with instant reload functionality.

### Production Build

To build a site for production, use the `nx build` command:

```bash
npx nx build my-new-site
```

Optimized and bundled resources will be placed in the `dist` directory.

### Preview Production

After building, you can preview the production output locally:

```bash
npx nx preview my-new-site
```

By default it will serve the built files from `dist` on the configured port; use `--port` to override. This is useful to validate routing/redirects/assets before deploying to your static host.

## License

This project is licensed under the MIT License.
