import fs from 'node:fs';
import path from 'node:path';
import { type RewriteRule } from 'vite-plugin-virtual-mpa';
import { I18nInfo, I18nLangPack, RouteMode, SiteOptions } from './types';
import { getPath, getProjectPath } from '@landing-page-sdk/utils-node';
import { readJsonFile } from '@nx/devkit';

export async function readSiteOptions(
  filePath = 'config.js'
): Promise<SiteOptions> {
  filePath = getPath(filePath);
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) return {};
  return ((await import(getPath(filePath)))?.default ?? {}) as SiteOptions;
}

export const REGEXP = {
  JSON: /\.json$/,
  SCRIPT: /\.(js|ts)$/,
  TEMPLATE: /^index\.(html|ejs)$/i,
  HTML: /\.html$/,
  EJS: /\.ejs$/,
};

export const rewrites = (siteOptions: SiteOptions): RewriteRule => {
  const { routeMode = 'tree', sourcePath = {} } = siteOptions;
  let { pages = './src/pages' } = sourcePath;

  pages = pages.replace(/\./g, '');

  const rules: RewriteRule = [
    {
      from: /.*/,
      to: ({ parsedUrl }) => {
        const { pathname } = parsedUrl;

        if (pathname?.includes(pages)) return '';
        if (pathname?.endsWith('.html')) return pathname;

        return `${
          pathname?.endsWith('/') ? pathname : pathname + '/'
        }index.html`;
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
  data: Record<string, any>,
  base: Record<string, any> = {}
) {
  const result = { ...base, ...data };
  result['_data'] = result;
  return result;
}

let langInfo: I18nInfo;

export function loadLangs(dir?: string): I18nInfo {
  if (langInfo) return langInfo;

  const emptyInfo = { langs: [], langPack: {} };

  if (!dir) return emptyInfo;

  const files = scanDir(dir, { match: REGEXP.JSON });

  if (!files.length) {
    return emptyInfo;
  }

  const langs: string[] = [];
  const langPack: I18nLangPack = {};

  for (const p of files) {
    if (!fs.statSync(p).isFile() || isHiddenFile(p)) {
      continue;
    }

    const lang = path.basename(p, '.json');
    const content = readJsonFile(p);
    langs.push(lang);
    langPack[lang] = content;
  }

  langInfo = { langs, langPack };

  return langInfo;
}

export function loadSites(dir: string): string[] {
  const files = scanDir(dir, { match: REGEXP.SCRIPT });

  if (!files.length) {
    return [];
  }

  return files
    .filter((p) => !isHiddenFile(p))
    .map((p) => (p.startsWith('/') ? p : `/${p}`));
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
      if (recursive) out.push(...scanDir(full, options));
      // 是否把這個「目錄本身」放進結果，再看 match
      if (!match || match.test(ent.name)) out.push(full);
    } else if (!match || match.test(ent.name)) out.push(full);
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
  if (vars) vars += ' from ';

  return `\nimport ${vars}'${id}';\n`;
}

export function useEnv(o: Record<string, any>) {
  const env: Record<string, any> = {};

  for (const key in o) {
    env[`import.meta.env.${key}`] = JSON.stringify(o[key]);
  }

  return env;
}
