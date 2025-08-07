import { PromiseExecutor } from '@nx/devkit';
import { createServer, build, type UserConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';
import { createMpaPlugin, type Page as _Page } from 'vite-plugin-virtual-mpa';
import {
  decoratePagesByLangs,
  findPages,
  injectDataToPages,
  loadLangs,
  rewrites,
} from '@landing-page-sdk/vite-pages';
import { getPath, getPathFromRoot } from '@landing-page-sdk/utils-node';

interface ViteExecutorSchema {
  cwd: string;
  mode: 'dev' | 'build' | 'preview';
  host?: boolean;
  port?: number;
} // eslint-disable-line

const runExecutor: PromiseExecutor<ViteExecutorSchema> = async (
  options,
  context
) => {
  // switch the working dir to current project
  process.chdir(getPathFromRoot(options.cwd));

  const root = getPath();
  const pages = findPages(getPath('src/pages'), root);
  injectDataToPages(pages, {
    useCmp: (...paths: string[]) => resolve('/src/components', ...paths),
  });
  const { langs, langPack } = loadLangs('src/i18n');
  decoratePagesByLangs(pages, langPack, langs);

  const mpaPlugin = createMpaPlugin({
    pages: pages as _Page[],
    rewrites,
  }) as Plugin[];

  const alias = {
    '@': getPath('src'),
  };

  const outDir = getPathFromRoot('dist');
  const userConfig: UserConfig = {
    mode: options.mode,
    server: {
      host: options.host,
      port: options.port,
    },
    build: {
      outDir,
    },
    resolve: {
      alias,
    },
    plugins: [],
    cacheDir: getPathFromRoot('node_modules/.vite-cache'),
  };

  switch (options.mode) {
    case 'dev':
      userConfig.plugins?.push(mpaPlugin);
      const server = await createServer(userConfig);
      await server.listen();
      server.printUrls();
      await new Promise<void>(() => {});
    case 'build':
      userConfig.plugins?.push(mpaPlugin);
      await build(userConfig);
      break;
    case 'preview':
      break;
  }

  return {
    success: true,
  };
};

export default runExecutor;
