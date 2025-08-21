import { resolve } from 'node:path';
import { PromiseExecutor } from '@nx/devkit';
import { createServer, build, preview, UserConfig, Plugin } from 'vite';
import { createMpaPlugin, Page as _Page } from 'vite-plugin-virtual-mpa';
import { merge } from 'lodash-es';
import { getPath, getPathFromRoot } from '@landing-page-sdk/utils-node';
import { ViteExecutorSchema } from '@landing-page-sdk/types';
import {
  parseMinify,
  readSiteOptions,
  rewrites,
  shadowData,
  parseEnv,
} from './lib/common';
import createPages from './lib/pages';
import sitesInjector from './lib/plugins/sites-injector';
import buildHelper from './lib/build-helper';

const runExecutor: PromiseExecutor<ViteExecutorSchema> = async (
  cliOptions,
  context
) => {
  process.chdir(getPathFromRoot(cliOptions.cwd));

  const siteOptions = await readSiteOptions(cliOptions.config);
  const { pages, langInfo, sites } = createPages(cliOptions, siteOptions);
  pages.forEach(
    (page) =>
      (page.data = shadowData(
        {
          useCmp: (...paths: string[]) => resolve('/src/components', ...paths),
          env: siteOptions.env,
        },
        page.data
      ))
  );
  // console.trace(pages);

  const minifyOptions = parseMinify(cliOptions, siteOptions);

  const mpaPlugin = createMpaPlugin({
    pages: pages as _Page[],
    rewrites: rewrites(siteOptions),
    htmlMinify: minifyOptions.html,
    // verbose: false,
  }) as Plugin[];

  const alias = {
    '@': getPath('src'),
  };

  const outDir = getPathFromRoot('dist');
  const define = parseEnv(
    merge(
      {
        langs: langInfo.langs,
      },
      siteOptions.env
    )
  );

  const userConfig: UserConfig = {
    define,
    mode: cliOptions.mode,
    server: {
      host: cliOptions.host,
      port: cliOptions.port,
    },
    build: {
      outDir,
      emptyOutDir: true,
      minify: minifyOptions.js,
      cssMinify: minifyOptions.css,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`,
        },
      },
      // modulePreload: {
      //   resolveDependencies(fn, deps, cxt) {
      //     console.log(fn, deps, cxt)
      //     return deps
      //   }
      // }
    },
    preview: {
      host: cliOptions.host,
      port: cliOptions.port,
    },
    resolve: {
      alias,
    },
    plugins: [
      ...(siteOptions.plugins ?? []),
      sitesInjector(pages, siteOptions),
      // virtualAssets(pages, siteOptions),
    ],
    cacheDir: getPathFromRoot('node_modules/.vite-cache'),
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') console.log(filename);
        return '/' + filename + `?v=foo123`;
      },
    },
  };

  switch (cliOptions.mode) {
    case 'dev':
      userConfig.plugins?.push(mpaPlugin);
      const devServer = await createServer(userConfig);
      await devServer.listen();
      devServer.printUrls();
      devServer.bindCLIShortcuts({ print: true });
      await new Promise<void>(() => {});
    case 'build':
      userConfig.plugins?.push(mpaPlugin);
      await build(userConfig);
      await buildHelper(outDir, sites);
      break;
    case 'preview':
      const previewServer = await preview(userConfig);
      previewServer.printUrls();
      previewServer.bindCLIShortcuts({ print: true });
      await new Promise<void>(() => {});
      break;
  }

  return {
    success: true,
  };
};

export default runExecutor;
