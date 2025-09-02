import { ExecutorContext } from '@nx/devkit';
import {
  createServer,
  build,
  preview,
  UserConfig,
  Plugin,
  ViteDevServer,
  PreviewServer,
} from 'vite';
import { createMpaPlugin, Page as _Page } from 'vite-plugin-virtual-mpa';
import { merge, pick, set } from 'lodash-es';
import { getPath, getPathFromRoot } from '@landing-page-sdk/utils-node';
import { SiteContext, ViteExecutorSchema } from '@landing-page-sdk/types';
import { parseMinify, readSiteOptions, rewrites, parseEnv } from './lib/common';
import createPages from './lib/pages';
import buildHelper from './lib/build-helper';
import sitesInjector from './lib/plugins/sites-injector';
import transformRedirect from './lib/plugins/transform-redirect';
import renderBuiltUrl from './lib/plugins/render-built-url';
import publicPorter from './lib/public-porter';
import autoController from './lib/plugins/auto-controller';

let devServer: ViteDevServer | null = null;
let previewServer: PreviewServer | null = null;

export async function teardown() {
  try {
    if (devServer) {
      await devServer.close();
      devServer = null;
    }
  } catch {}
  try {
    if (previewServer) {
      await previewServer.close();
      previewServer = null;
    }
  } catch {}
}

export async function main(
  cliOptions: ViteExecutorSchema,
  context: ExecutorContext
) {
  // create site context
  const siteOptions = await readSiteOptions(cliOptions.config);
  const pagesInfo = createPages(cliOptions, siteOptions);
  const siteContext: SiteContext = { pagesInfo, cliOptions, siteOptions };

  const minifyOptions = parseMinify(cliOptions, siteOptions);

  const userConfig: UserConfig = {};

  // shared
  set(userConfig, 'mode', cliOptions.mode);
  const define = parseEnv(
    merge(pick(pagesInfo.langInfo, 'langs'), siteOptions.env)
  );
  set(userConfig, 'define', define);
  const cacheDir = getPathFromRoot('node_modules/.vite-cache');
  set(userConfig, 'cacheDir', cacheDir);
  set(userConfig, 'publicDir', siteOptions.sourcePath?.public);
  set(userConfig, 'plugins', [
    ...(siteOptions.plugins ?? []),
    sitesInjector(siteContext),
    transformRedirect(siteContext),
    renderBuiltUrl(siteContext),
    autoController(siteContext),
  ]);

  // resolve
  const alias = { '@': getPath('src') };
  set(userConfig, 'resolve.alias', alias);

  // server
  set(userConfig, 'server.host', cliOptions.host);
  set(userConfig, 'server.port', cliOptions.port);
  const openTarget = pagesInfo.pages[0]!.filename as string;
  set(userConfig, 'server.open', openTarget);

  // preview
  set(userConfig, 'preview.host', cliOptions.host);
  set(userConfig, 'preview.port', cliOptions.port);
  set(userConfig, 'preview.open', openTarget);

  // build
  const outDir = getPathFromRoot('dist');
  set(userConfig, 'build.outDir', outDir);
  set(userConfig, 'build.emptyOutDir', true);
  set(userConfig, 'build.copyPublicDir', false);
  set(userConfig, 'build.minify', minifyOptions.js);
  set(userConfig, 'build.cssMinify', minifyOptions.css);

  // mpa
  const mpaPlugin = createMpaPlugin({
    pages: pagesInfo.pages as _Page[],
    rewrites: rewrites(siteOptions),
    htmlMinify: minifyOptions.html,
    // verbose: false,
  }) as Plugin[];

  switch (cliOptions.mode) {
    case 'dev':
      userConfig.plugins?.push(mpaPlugin);
      devServer = await createServer(userConfig);
      await devServer.listen();
      devServer.printUrls();
      devServer.bindCLIShortcuts({ print: true });
      break;
    case 'build':
      userConfig.plugins?.push(mpaPlugin);
      await build(userConfig);
      await buildHelper(outDir, pagesInfo.sites);
      await publicPorter({
        outDir,
        sites: pagesInfo.sites,
        publicDir: siteOptions.sourcePath?.public,
        thresholdBytes: siteOptions.threshold,
      });
      break;
    case 'preview':
      previewServer = await preview(userConfig);
      previewServer.printUrls();
      previewServer.bindCLIShortcuts({ print: true });
      break;
  }

  return true;
}
