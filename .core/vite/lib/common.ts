import fs from 'node:fs';
import path from 'node:path';
import { type RewriteRule } from 'vite-plugin-virtual-mpa';
import { I18nInfo, I18nLangPack, SiteOptions } from './types';
import { getPath } from '@landing-page-sdk/utils-node';

async function readSiteOptions(filePath = 'config.js'): Promise<SiteOptions> {
  try {
    return ((await import(getPath(filePath)))?.default ?? {}) as SiteOptions;
  } catch {
    return {};
  }
}

export const REGEXP = {
  JSON: /\.json$/,
  SCRIPT: /\.(js|ts)$/,
  TEMPLATE: /^index\.(html|ejs)$/i,
  HTML: /\.html$/,
  EJS: /\.ejs$/,
};

export const rewrites: RewriteRule = [
  {
    from: /^\/src\/pages.*$/, // all requests from /src/pages
    to: '',
  },
  {
    from: /^\/?$/, // '' or '/'
    to: '/index.html',
  },
  {
    from: /^\/?(.*)\/?$/, // '/about', 'about/', '/about/', etc.
    to: ({ match }) => {
      const path = match[1].replace(/\/$/, '');
      return path === '' ? '/index.html' : `/${path}/index.html`;
    },
  },
];

export function shadowData(
  data: Record<string, any>,
  base: Record<string, any> = {}
) {
  const result = { ...base, ...data };
  result['_data'] = result;
  return result;
}

export function loadLangs(dir: string): I18nInfo {
  const files = scanDir(dir, { match: REGEXP.JSON });

  if (!files.length) {
    return { langs: [], langPack: {} };
  }

  const langs: string[] = [];
  const langPack: I18nLangPack = {};

  for (const p of files) {
    if (!fs.statSync(p).isFile()) {
      continue;
    }

    const lang = path.basename(p, '.json');
    const content = JSON.parse(fs.readFileSync(p, 'utf-8'));
    langs.push(lang);
    langPack[lang] = content;
  }

  return { langs, langPack };
}

export function loadSites(dir: string): string[] {
  const files = scanDir(dir, { match: REGEXP.SCRIPT });

  if (!files.length) {
    return [];
  }

  const jsFiles: string[] = [];

  for (const item of files) {
    const fullPath = path.join(dir, item);
    let stats: fs.Stats;

    try {
      stats = fs.statSync(fullPath);
    } catch {
      continue;
    }

    if (stats.isFile()) {
      jsFiles.push(fullPath);
    }
  }

  return jsFiles;
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
  if (!fs.existsSync(dir)) return [];

  const { match, recursive = false } = options || {};
  let res: string[] = [];

  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);

    if (match && !match.test(name)) {
      continue;
    }

    res.push(full);

    if (recursive && stat.isDirectory()) {
      res = res.concat(scanDir(full, options));
    }
  }

  return res;
}
