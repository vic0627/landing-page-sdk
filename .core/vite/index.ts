import { AsyncIteratorExecutor, PromiseExecutor } from '@nx/devkit';
import chokidar from 'chokidar';
import {
  getPathFromRoot,
  getProjectPath,
  loadHMR,
} from '@landing-page-sdk/utils-node';
import {
  NormalizedSiteConfig,
  ViteExecutorSchema,
} from '@landing-page-sdk/types';
import path from 'node:path';
import chalk from 'chalk';

const viteExecutor: AsyncIteratorExecutor<ViteExecutorSchema> =
  async function* (cliOptions, context) {
    // switch working dir
    process.chdir(getPathFromRoot(cliOptions.cwd));

    let main!: (...args: any[]) => Promise<boolean>;
    let teardown!: () => Promise<void>;
    let getSiteConfig!: () => NormalizedSiteConfig | null;

    const initMainMod = () => {
      const mod = loadHMR('@landing-page-sdk/vite-executor');
      ({ main, teardown, getSiteConfig } = mod);
    };

    // 先跑一次
    initMainMod();
    yield { success: await main(cliOptions, context) };

    // build 模式單次就結束
    if (cliOptions.mode === 'build') return;

    const watchGlobs = [
      getProjectPath('@landing-page-sdk/vite-executor'),
      getProjectPath('@landing-page-sdk/utils-node'),
      cliOptions.config ?? 'site.config.js',
    ];

    const siteConfig = getSiteConfig();

    if (siteConfig) {
      const { i18n, sites } = siteConfig.sourcePath;
      watchGlobs.push(i18n, sites);
    }

    const watcher = chokidar.watch(watchGlobs, {
      ignoreInitial: true,
    });

    let resolve!: (value?: unknown) => void;
    let plug!: Promise<any>;

    const initPlug = () => {
      plug = new Promise((r) => {
        resolve = r;
      });
    };

    initPlug();

    // 監看事件只負責「發訊號」
    watcher.on('all', (evt, file) => {
      file = path.relative(getPathFromRoot(), file);
      console.clear();
      const now = new Date().toLocaleTimeString();
      console.log(
        `${chalk.dim(now)} ${chalk.bold.cyanBright('[executor]')} ${chalk.green(
          'program reload'
        )} ${chalk.dim(`(${evt}: ${file})`)}`
      );
      resolve();
      initPlug();
    });

    // --- 主迴圈：在 generator 本體中等待訊號、執行 main 並 yield ---
    while (true) {
      await plug; // 等待檔案變更訊號
      await teardown();
      initMainMod();
      yield { success: await main(cliOptions, context) }; // ← 只能在這裡 yield
    }
  };

export default viteExecutor;
