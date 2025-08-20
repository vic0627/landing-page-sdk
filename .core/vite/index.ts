import { PromiseExecutor, writeJsonFile } from '@nx/devkit';
import {
  createServer,
  build,
  preview,
  type UserConfig,
  type Plugin,
} from 'vite';
import { resolve } from 'node:path';
import { createMpaPlugin, type Page as _Page } from 'vite-plugin-virtual-mpa';
import createPages from './lib/pages';
import { getPath, getPathFromRoot } from '@landing-page-sdk/utils-node';
import type { SiteOptions, ViteExecutorSchema } from './lib/types';
import {
  loadLangs,
  readSiteOptions,
  rewrites,
  shadowData,
  useEnv,
} from './lib/common';
import sitesInjector from './lib/plugins/sites-injector';
import virtualAssets from './lib/plugins/virtual-assets';
import { merge } from 'lodash-es';

const runExecutor: PromiseExecutor<ViteExecutorSchema> = async (
  cliOptions,
  context
) => {
  // switch the working dir to current project
  process.chdir(getPathFromRoot(cliOptions.cwd));

  const siteOptions = await readSiteOptions(cliOptions.config);
  const pages = createPages(cliOptions, siteOptions);
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
  // console.log(pages);

  const mpaPlugin = createMpaPlugin({
    pages: pages as _Page[],
    rewrites: rewrites(siteOptions),
    // verbose: false,
  }) as Plugin[];

  const alias = {
    '@': getPath('src'),
  };

  const outDir = getPathFromRoot('dist');
  const define = useEnv(
    merge(
      {
        langs: loadLangs().langs,
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
    },
    resolve: {
      alias,
    },
    plugins: [
      sitesInjector(pages, siteOptions),
      // virtualAssets(pages, siteOptions),
    ],
    cacheDir: getPathFromRoot('node_modules/.vite-cache'),
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
      break;
    case 'preview':
      // const previewServer = await preview(userConfig);
      // previewServer.printUrls();
      // previewServer.bindCLIShortcuts({ print: true });
      // await new Promise<void>(() => {});
      break;
  }

  return {
    success: true,
  };
};

export default runExecutor;
