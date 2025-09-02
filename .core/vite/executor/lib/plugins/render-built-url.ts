import { set } from 'lodash-es';
import { OutputAsset, OutputChunk } from 'rollup';
import { SDKPlugin } from '@landing-page-sdk/types';
import { timestampHash } from '@landing-page-sdk/utils-node';

const BASE = '/__BASE__/';
const HTML_BASE_RE = /\/__BASE__\/([^\s"'>,)]+)/g;
const CSS_URL_RE = /url\(\s*(?:["'])?\/__BASE__\/([^)"']+)(?:["'])?\s*\)/g;
const ASSETS = '__ASSETS__';

export default (({ pagesInfo, cliOptions, siteOptions }) => {
  const versioning = parseOption(siteOptions, cliOptions, 'versioning', 'hard');
  const baseType = parseOption(siteOptions, cliOptions, 'assets', 'abs');
  const routeMode = siteOptions.routeMode ?? 'tree';

  const outputFilenames: Record<string, string> = {
    hard: {
      entryFileNames: `${ASSETS}/[name].[hash].js`,
      chunkFileNames: `${ASSETS}/[name].[hash].js`,
      assetFileNames: `${ASSETS}/[name].[hash].[ext]`,
    },
    soft: {
      entryFileNames: `${ASSETS}/[name].js`,
      chunkFileNames: `${ASSETS}/[name].js`,
      assetFileNames: `${ASSETS}/[name].[ext]`,
    },
  }[versioning];

  const hash = timestampHash();

  const rootRel = (hostId: string) => {
    let depth = hostId.split('/').length - 1;

    if (pagesInfo.langInfo.langs.length < 2) {
      depth--;
    }

    if (pagesInfo.sites.length) {
      depth--;
    }

    depth = depth < 0 ? 0 : depth;

    return Array.from({ length: depth }, () => '..').join('/') || '.';
  };

  const transformPath = (
    filename: string,
    path: string,
    type: string
  ): string => {
    const rel = rootRel(filename);
    let renderFilename = '/' + path;

    if (baseType === 'rel') {
      switch (type) {
        case 'html':
          renderFilename = (routeMode === 'flat' ? '.' : rel) + renderFilename;

          break;
        case 'css':
          renderFilename = '..' + renderFilename;

          break;
      }
    }

    if (versioning === 'soft') {
      renderFilename += `?v=${hash}`;
    }

    return renderFilename;
  };

  return {
    name: 'vite-plugin-render-build-url',
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
          // js doesn't support path transformation
          const asset = bundle[filename] as OutputChunk;
          const rel = baseType === 'rel' ? './' : '/';
          asset.code = asset.code.replaceAll(BASE, rel);

          continue;
        }

        let content = asset.source.toString();

        if (filename.endsWith('.css')) {
          content = content.replace(CSS_URL_RE, (_, rel) => {
            rel = transformPath(filename, rel, 'css');
            return `url(${JSON.stringify(rel)})`;
          });
        } else if (filename.endsWith('.html')) {
          content = content.replace(HTML_BASE_RE, (_, rel) => {
            rel = transformPath(filename, rel, 'html');
            return rel;
          });
        }

        asset.source = Buffer.from(content);
      }
    },
  };
}) satisfies SDKPlugin;

function parseOption<T1, T2, K extends keyof T1 & keyof T2>(
  o1: T1,
  o2: T2,
  k: K,
  defaultVal: T1[K] | T2[K]
) {
  let value = o1[k] ?? defaultVal;

  if (o2[k]) {
    value = o2[k];
  }

  return value!;
}
