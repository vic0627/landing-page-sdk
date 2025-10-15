import fsp from 'node:fs/promises';
import chalk from 'chalk';
import { RewriteRule } from 'vite-plugin-virtual-mpa';
import { ViteMockOptions } from 'vite-plugin-mock';
import { isString } from 'lodash-es';
import {
  NormalizedSiteConfig,
  PageData,
  PageDataCommon,
  SiteContext,
  SiteConfig,
} from '@landing-page-sdk/types';
import { getPath, getProjectPath } from '@landing-page-sdk/utils-node';

export async function readRawSiteConfig(
  filePath = 'site.config.js'
): Promise<SiteConfig> {
  const isFile = (await fsp.stat(filePath)).isFile();

  if (!isFile) return {};

  const mod = await import(getPath(filePath));

  return (mod?.default ?? {}) as SiteConfig;
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

export const rewrites = (cfg: NormalizedSiteConfig): RewriteRule => {
  const { sourcePath } = cfg;
  let { pages } = sourcePath;

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

export function shadowData(
  data: Partial<PageData>,
  base: Partial<PageData> = {}
) {
  const result = { ...base, ...data };
  result._data = result as PageDataCommon;
  return result as PageData;
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

interface NamedLoggerOptions {
  name: string;
  type?: 'log' | 'table';
  verbose?: boolean;
}

export function namedLogger(options: NamedLoggerOptions) {
  const name = chalk.cyanBright(options.name);
  return function (...messages: any[]) {
    if (!options.verbose) {
      return;
    }
    if (options.type === 'table') {
      const [title, data, props] = messages;
      console.log(`[${name}]:`, title);
      console.table(data, props);
    } else {
      console.log(`[${name}]:`, ...messages);
    }
  };
}

export type Logger = ReturnType<typeof namedLogger>;

export function mockOptions(ctx: SiteContext): ViteMockOptions {
  const { cliOption, siteConfig } = ctx;

  const options: ViteMockOptions = {
    mockPath: '',
    watchFiles: true,
    logger: cliOption.verbose ?? false,
  };

  if (siteConfig.mock === false) {
    options.enable = false;
  } else if (isString(siteConfig.mock)) {
    options.mockPath = siteConfig.mock.startsWith('@')
      ? getProjectPath(siteConfig.mock)
      : siteConfig.mock;
  }

  return options;
}
