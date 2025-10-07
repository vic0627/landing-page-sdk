import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { RewriteRule } from 'vite-plugin-virtual-mpa';
import {
  MinifyTargets,
  Page,
  PageData,
  PagesInfo,
  SiteOptions,
  ViteExecutorSchema,
} from '@landing-page-sdk/types';
import { getPath } from '@landing-page-sdk/utils-node';

export async function readSiteOptions(
  filePath = 'site.config.js'
): Promise<SiteOptions> {
  // filePath = getPath(filePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return {};
  return ((await import(getPath(filePath)))?.default ?? {}) as SiteOptions;
}

export const REGEXP = {
  JSON: /\.json$/,
  SCRIPT: /\.(js|ts)$/,
  TEMPLATE: /^index\.(html|ejs)$/i,
  HTML: /\.html$/,
  EJS: /\.ejs$/,
  REDIRECT: /^(?:.*:)?redirect$/,
  STUB: /^(?:.*:)?stub$/,
  HTML_PUBLIC: /(?:src|srcset|href)=(["'])(.*?)\1/g,
  CSS_PUBLIC: /url\((["']?)(.*?)\1\)/g,
};

export const rewrites = (siteOptions: SiteOptions): RewriteRule => {
  const { sourcePath = {} } = siteOptions;
  let { pages = './src/pages' } = sourcePath;

  pages = pages.replace(/\./g, '');

  const rules: RewriteRule = [
    {
      from: /.*/,
      to: ({ parsedUrl }) => {
        const { pathname } = parsedUrl;

        if (pathname?.includes(pages)) {
          return '';
        }

        if (pathname?.endsWith('.html')) {
          return pathname;
        }

        if (!pathname?.endsWith('/')) {
          return '';
        }

        return `${pathname}index.html`;
      },
    },
  ];

  return rules;
};

export function isHiddenFile(filePath: string) {
  const filename = path.parse(filePath).name;
  return filename.startsWith('.');
}

export function shadowData(
  data: Partial<PageData>,
  base: Partial<PageData> = {}
) {
  const result = { ...base, ...data };
  result['_data'] = result;
  return result as PageData;
}

type ScanOptions = {
  /**
   * 匹配的目錄或檔案
   */
  match?: RegExp;
  /**
   * 遞迴掃描
   * @default false
   */
  recursive?: boolean;
};

/**
 * 掃描目標目錄，返回檔案或目錄的路徑
 */
export function scanDir(dir: string, options?: ScanOptions): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const { recursive = false } = options || {};
  // 避免 g-flag 造成 .test() 受 lastIndex 影響
  const match = options?.match
    ? new RegExp(options.match.source, options.match.flags.replace('g', ''))
    : undefined;

  const out: string[] = [];
  const items = fs.readdirSync(dir, { withFileTypes: true }); // Dirent, 無需再 statSync

  for (const ent of items) {
    const full = path.join(dir, ent.name);

    if (ent.isDirectory()) {
      // **重點：無論目錄名是否匹配，都先遞迴**
      if (recursive) {
        out.push(...scanDir(full, options));
      }

      // 是否把這個「目錄本身」放進結果，再看 match
      if (!match || match.test(ent.name)) {
        out.push(full);
      }
    } else if (!match || match.test(ent.name)) {
      out.push(full);
    }
  }

  return out;
}

interface ImportStatementOptions {
  default?: string;
  imports?: string[];
}

export function getImportStatement(
  id: string,
  options?: ImportStatementOptions
) {
  if (!id) {
    throw new Error(`'id' is required for import statement`);
  }

  const { default: _default, imports = [] } = options ?? {};

  let vars = '';

  if (_default) {
    vars = _default;
  }

  if (imports.length) {
    vars += `{${imports.join()}`;
  }

  if (vars) {
    vars += ' from ';
  }

  return `\nimport ${vars}'${id}';\n`;
}

export function parseEnv(o: Record<string, any>) {
  const env: Record<string, any> = {};

  for (const key in o) {
    env[`import.meta.env.${key}`] = JSON.stringify(o[key]);
  }

  return env;
}

export function parseMinify(
  cliOptions: ViteExecutorSchema,
  siteOptions: SiteOptions
) {
  const minifyInfo: Record<MinifyTargets, boolean> = {
    html: true,
    js: true,
    css: true,
  };

  const cliMinify = cliOptions.minify;
  const sitesMinify = siteOptions.output?.minify;

  if (cliMinify === undefined && sitesMinify === undefined) {
    return minifyInfo;
  }

  if (cliMinify !== undefined) {
    if (typeof cliMinify === 'boolean') {
      for (const key in minifyInfo) {
        minifyInfo[key as MinifyTargets] = cliMinify;
      }
    } else if (typeof cliMinify === 'string') {
      const minifyTargets = cliMinify.split(',');

      for (const key in minifyInfo) {
        minifyInfo[key as MinifyTargets] = minifyTargets.includes(key);
      }
    }

    return minifyInfo;
  }

  if (sitesMinify !== undefined) {
    if (typeof sitesMinify === 'boolean') {
      for (const key in minifyInfo) {
        minifyInfo[key as MinifyTargets] = sitesMinify;
      }
    } else if (typeof sitesMinify === 'string') {
      for (const key in minifyInfo) {
        minifyInfo[key as MinifyTargets] = key === sitesMinify;
      }
    } else if (Array.isArray(sitesMinify)) {
      for (const key in minifyInfo) {
        minifyInfo[key as MinifyTargets] = sitesMinify.includes(
          key as MinifyTargets
        );
      }
    }

    return minifyInfo;
  }

  return minifyInfo;
}

interface NamedLoggerOptions {
  name: string;
  verbose?: boolean;
}

export function namedLogger(options: NamedLoggerOptions) {
  const name = chalk.cyanBright(options.name);
  return function (...messages: any[]) {
    if (!options.verbose) {
      return;
    }
    console.log(`[${name}]:`, ...messages);
  };
}

export type Logger = ReturnType<typeof namedLogger>;
