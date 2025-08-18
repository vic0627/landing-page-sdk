import { PromiseExecutor } from '@nx/devkit';
import {
  createServer,
  build,
  preview,
  type UserConfig,
  type Plugin,
} from 'vite';
import { resolve } from 'node:path';
import { createMpaPlugin, type Page as _Page } from 'vite-plugin-virtual-mpa';
// import {
//   decoratePagesByLangs,
//   findPages,
//   injectDataToPages,
//   loadLangs,
//   rewrites,
// } from '@landing-page-sdk/vite-pages';
import { getPath, getPathFromRoot } from '@landing-page-sdk/utils-node';
import type { SiteOptions, ViteExecutorSchema } from './lib/types';
import { readSiteOptions } from './lib/common';

const runExecutor: PromiseExecutor<ViteExecutorSchema> = async (
  cliOptions,
  context
) => {
  // switch the working dir to current project
  process.chdir(getPathFromRoot(cliOptions.cwd));

  const siteOptions = await readSiteOptions(cliOptions.config);

  console.log(siteOptions);

  // const root = getPath();
  // const pages = findPages(getPath('src/pages'), root);
  // injectDataToPages(pages, {
  //   useCmp: (...paths: string[]) => resolve('/src/components', ...paths),
  // });
  // const { langs, langPack } = loadLangs('src/i18n');
  // decoratePagesByLangs(pages, langPack, langs);

  // const mpaPlugin = createMpaPlugin({
  //   pages: pages as _Page[],
  //   rewrites,
  // }) as Plugin[];

  const alias = {
    '@': getPath('src'),
  };

  const outDir = getPathFromRoot('dist');
  const userConfig: UserConfig = {
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
    plugins: [],
    cacheDir: getPathFromRoot('node_modules/.vite-cache'),
  };

  switch (cliOptions.mode) {
    case 'dev':
    // userConfig.plugins?.push(mpaPlugin);
    // const devServer = await createServer(userConfig);
    // await devServer.listen();
    // devServer.printUrls();
    // devServer.bindCLIShortcuts({ print: true });
    // await new Promise<void>(() => {});
    case 'build':
      // userConfig.plugins?.push(mpaPlugin);
      // await build(userConfig);
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
