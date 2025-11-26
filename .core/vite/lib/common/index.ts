import { access } from 'node:fs/promises';
import chalk from 'chalk';
import { RewriteRule } from 'vite-plugin-virtual-mpa';
import { ViteMockOptions } from 'vite-plugin-mock';
import { isString } from 'lodash-es';
import { NormalizedSiteConfig, SiteContext } from '@landing-page-sdk/types';
import { resolveProj, isDir, join } from '@landing-page-sdk/utils-node';

export * from './page';
export * from './regexp';
export * from './route-manifest';

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

interface ImportStatementOptions {
  default?: string;
  imports?: string[];
}

export function getImportStatement(id: string, options?: ImportStatementOptions) {
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

export async function mockOptions(ctx: SiteContext): Promise<ViteMockOptions> {
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
      ? resolveProj(siteConfig.mock)
      : siteConfig.mock;
  }

  const isValidDir = await isDir(options.mockPath as string);

  if (!isValidDir) {
    options.enable = false;
  }

  return options;
}

export async function findExist(
  files: string[],
  defaultFile?: string
): Promise<string | undefined> {
  for (const file of files) {
    try {
      await access(file);
      return file.startsWith('/') ? file : join('/', file);
    } catch {
      // 檔案不存在 → 跳下一個
    }
  }

  return defaultFile;
}
