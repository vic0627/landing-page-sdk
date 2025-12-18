import { createProjectGraphAsync, ExecutorContext } from '@nx/devkit';
import {
  createServer,
  build,
  preview,
  Plugin,
  ViteDevServer,
  PreviewServer,
  InlineConfig,
} from 'vite';
import chalk from 'chalk';
import { merge, omit, pick, set } from 'lodash-es';
import { resolve, resolveRoot } from '@landing-page-sdk/utils-node';
import { NormalizedSiteConfig, SiteContext, ViteExecutorSchema } from '@landing-page-sdk/types';
import { rewrites, parseEnv, mockOptions } from './lib/common';
import createPages from './lib/pages';
// post build
import siteDistributor from './lib/post-build/site-distributor';
import publicPorter from './lib/post-build/public-porter';
import sitemapGenerator from './lib/post-build/sitemap-generator';
// plugins
import { createMpaPlugin, Page as _Page } from 'vite-plugin-virtual-mpa';
import { viteMockServe } from 'vite-plugin-mock';
import sitesInjector from './lib/plugins/sites-injector';
import transformRedirect from './lib/plugins/transform-redirect';
import renderBuiltUrl from './lib/plugins/render-built-url';
import autoController from './lib/plugins/auto-controller';
// import redirect from './lib/plugins/redirect';
import routerLink from './lib/plugins/router-link';
import pageContext from './lib/plugins/page-context';
import virtualAssets from './lib/plugins/virtual-assets';

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

export async function main(options: {
  siteConfig: NormalizedSiteConfig;
  cliOption: ViteExecutorSchema;
  context: ExecutorContext;
  isFirstProcess: boolean;
}) {
  const { siteConfig, cliOption, context, isFirstProcess } = options;
  // initialize project graph in each processes, or otherwise `readCachedProjectGraph()` could cause error
  await createProjectGraphAsync();
  // create site context
  const pagesInfo = await createPages({ cli: cliOption, cfg: siteConfig });
  const siteContext: SiteContext = { pagesInfo, cliOption, siteConfig };

  // configs
  const config: InlineConfig = {};

  const define = parseEnv(
    merge(siteConfig.env, { SDK_CONFIG: omit(siteConfig, 'plugins', 'env', 'sourcePath') })
  );
  const cacheDir = resolveRoot('node_modules/.vite-cache');
  const alias = { '@': resolve('src') };
  const outDir = siteConfig.output.dist;

  // shared
  set(config, 'mode', cliOption.mode);
  set(config, 'define', define);
  set(config, 'cacheDir', cacheDir);
  set(config, 'publicDir', siteConfig.sourcePath.public);
  set(config, 'plugins', [
    ...siteConfig.plugins,
    sitesInjector(siteContext),
    transformRedirect(siteContext),
    renderBuiltUrl(siteContext),
    autoController(siteContext),
    // redirect(siteContext),
    viteMockServe(await mockOptions(siteContext)),
    routerLink(siteContext),
    pageContext(siteContext),
    virtualAssets(siteContext),
  ]);

  // resolve
  set(config, 'resolve.alias', alias);

  // server
  set(config, 'server.host', cliOption.host);
  set(config, 'server.port', cliOption.port);

  // preview
  set(config, 'preview.host', cliOption.host);
  set(config, 'preview.port', cliOption.port);

  if (isFirstProcess) {
    const openTarget = pagesInfo.pages[0]!.filename as string;
    set(config, 'server.open', openTarget);
    set(config, 'preview.open', openTarget);
  }

  // build
  set(config, 'build.outDir', outDir);
  set(config, 'build.emptyOutDir', true);
  set(config, 'build.copyPublicDir', false);
  set(config, 'build.minify', siteConfig.output.minify.js);
  set(config, 'build.cssMinify', siteConfig.output.minify.css);

  if (pagesInfo.sites.length) {
    set(config, 'build.manifest', true);
  }

  // mpa
  const mpaPlugin = createMpaPlugin({
    pages: pagesInfo.pages as _Page[],
    rewrites: rewrites(siteConfig),
    htmlMinify: siteConfig.output.minify.html,
    verbose: cliOption.verbose ?? false,
  }) as Plugin[];

  switch (cliOption.mode) {
    case 'dev':
      config.plugins?.push(mpaPlugin);
      devServer = await createServer(config);
      await devServer.listen();
      devServer.printUrls();
      devServer.bindCLIShortcuts({ print: true });
      printVerboseHint(cliOption.verbose);
      break;
    case 'build':
      config.plugins?.push(mpaPlugin);
      await build(config);
      await siteDistributor(siteContext, outDir);
      await publicPorter(siteContext, outDir);
      await sitemapGenerator(siteContext, outDir);
      break;
    case 'preview':
      /** @todo preview doesn't work well, mock api plugin is unavailable */
      previewServer = await preview(config);
      previewServer.printUrls();
      previewServer.bindCLIShortcuts({ print: true });
      printVerboseHint(cliOption.verbose);
      break;
  }

  return true;
}

function printVerboseHint(verbose?: boolean) {
  verbose ??
    console.log(
      `  ${chalk.dim.green('➜')}  ${chalk.dim.white('use')} ${chalk.bold(
        '--verbose'
      )} ${chalk.dim.white('to print log')}`
    );
}
