import { ExecutorContext } from '@nx/devkit';
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
import { merge, pick, set } from 'lodash-es';
import { resolve, resolveRoot } from '@landing-page-sdk/utils-node';
import {
  NormalizedSiteConfig,
  SiteContext,
  ViteExecutorSchema,
} from '@landing-page-sdk/types';
import {
  readRawSiteConfig,
  rewrites,
  parseEnv,
  mockOptions,
} from './lib/common';
import configNormalizer from './lib/config-normalizer';
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
import redirect from './lib/plugins/redirect';
import routerLink from './lib/plugins/router-link';

let devServer: ViteDevServer | null = null;
let previewServer: PreviewServer | null = null;
let siteConfig: NormalizedSiteConfig | null = null;

export function getSiteConfig() {
  return siteConfig;
}

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
  cliOption: ViteExecutorSchema,
  context: ExecutorContext
) {
  // create site context
  const rawSiteConfig = await readRawSiteConfig(cliOption.config);
  siteConfig = configNormalizer(rawSiteConfig);
  const pagesInfo = await createPages({ cli: cliOption, cfg: siteConfig });
  const siteContext: SiteContext = { pagesInfo, cliOption, siteConfig };

  // configs
  const config: InlineConfig = {};

  const define = parseEnv(
    merge(pick(pagesInfo.langInfo, 'langs'), siteConfig.env)
  );
  const cacheDir = resolveRoot('node_modules/.vite-cache');
  const alias = { '@': resolve('src') };
  const openTarget = pagesInfo.pages[0]!.filename as string;
  const outDir = resolveRoot('dist');

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
    redirect(siteContext),
    viteMockServe(mockOptions(siteContext)),
    routerLink(siteContext),
  ]);

  // resolve
  set(config, 'resolve.alias', alias);

  // server
  set(config, 'server.host', cliOption.host);
  set(config, 'server.port', cliOption.port);
  // set(config, 'server.open', openTarget);

  // preview
  set(config, 'preview.host', cliOption.host);
  set(config, 'preview.port', cliOption.port);
  // set(config, 'preview.open', openTarget);

  // build
  set(config, 'build.outDir', outDir);
  set(config, 'build.emptyOutDir', true);
  set(config, 'build.copyPublicDir', false);
  set(config, 'build.minify', siteConfig.output.minify.js);
  set(config, 'build.cssMinify', siteConfig.output.minify.css);

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
