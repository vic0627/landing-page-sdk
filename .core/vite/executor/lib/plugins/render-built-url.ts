import { findIndex, set } from 'lodash-es';
import { OutputAsset, OutputChunk } from 'rollup';
import chalk from 'chalk';
import { MinifyTargets, Page, SDKPlugin } from '@landing-page-sdk/types';
import { base62Hash, join } from '@landing-page-sdk/utils-node';
import { namedLogger } from '../common';

const BASE = '/__BASE__/';
const HTML_BASE_RE = /\/__BASE__\/([^\s"'>,)]+)/g;
const CSS_URL_RE = /url\(\s*(?:["'])?\/__BASE__\/([^)"']+)(?:["'])?\s*\)/g;
const JS_IMPORT_RE =
  /(import\s+(?:[\s\S]*?\s+from\s+)?)["']([^"']+)["'](.*?;?)/g;
const ASSETS = '__ASSETS__';

const name = 'vite-plugin-render-build-url';

export default (({ pagesInfo, cliOption, siteConfig }) => {
  const { versioning, assetsResolution: resolution } = siteConfig.output;
  const routeMode = siteConfig.route.mode;
  const sites = Object.keys(pagesInfo.sites);

  const outputFilenames: Record<string, string> = {
    hard: {
      entryFileNames: `${ASSETS}/[name]-[hash].js`,
      chunkFileNames: `${ASSETS}/[name]-[hash].js`,
      assetFileNames: `${ASSETS}/[name]-[hash].[ext]`,
    },
    soft: {
      entryFileNames: `${ASSETS}/[name].js`,
      chunkFileNames: `${ASSETS}/[name].js`,
      assetFileNames: `${ASSETS}/[name].[ext]`,
    },
  }[versioning];

  const hash = base62Hash(Date.now().toString(), 6);

  const rootRel = (hostId: string) => {
    let depth = hostId.split('/').length - 1;

    if (pagesInfo.langInfo.langs.length < 2) {
      depth--;
    }

    if (sites.length) {
      depth--;
    }

    depth = depth < 0 ? 0 : depth;

    return Array.from({ length: depth }, () => '..').join('/') || '.';
  };

  const transformPath = (
    filename: string,
    path: string,
    type: MinifyTargets,
    page?: Page
  ): string => {
    let render = path;

    if (resolution === 'rel') {
      switch (type) {
        case 'html':
          const rel = rootRel(filename);
          render = join(`${routeMode === 'flat' ? '.' : rel}/`, render);
          break;
        case 'css':
          render = join('../', render);
          break;
      }
    } else {
      switch (type) {
        case 'html':
          render = join('/', page?.data?.alias ?? '', render);
          break;
        case 'css':
          render = join('../', render);
          break;
      }
    }

    if (versioning === 'soft') {
      render += `?v=${hash}`;
    }

    return render;
  };

  const log = namedLogger({
    name,
    verbose: cliOption.verbose,
  });

  log(
    `Static asset path mode: ${chalk.green(
      resolution === 'rel' ? 'relative' : 'absolute'
    )}`
  );

  return {
    name,
    enforce: 'post',
    apply: 'build',
    config(uc) {
      for (const key in outputFilenames) {
        set(uc, `build.rollupOptions.output.${key}`, outputFilenames[key]);
      }

      set(uc, 'base', BASE);
    },
    generateBundle(_, bundle) {
      for (const filename in bundle) {
        const asset = bundle[filename] as OutputAsset;
        if (
          !asset ||
          (typeof asset.source !== 'string' && !Buffer.isBuffer(asset.source))
        ) {
          const asset = bundle[filename] as OutputChunk;
          asset.code = asset.code.replace(JS_IMPORT_RE, (_, pre, rel, post) => {
            rel = JSON.stringify(transformPath(filename, rel, 'js'));
            return pre + rel + post;
          });

          continue;
        }

        let content = asset.source.toString();

        if (filename.endsWith('.css')) {
          content = content.replace(CSS_URL_RE, (_, rel) => {
            rel = transformPath(filename, rel, 'css');
            return `url(${JSON.stringify(rel)})`;
          });
        } else if (filename.endsWith('.html')) {
          const page = pagesInfo.pages.find((p) => p.filename === filename);
          content = content.replace(HTML_BASE_RE, (_, rel) => {
            return transformPath(filename, rel, 'html', page);
          });
        }

        asset.source = Buffer.from(content);
      }
    },
  };
}) satisfies SDKPlugin;
