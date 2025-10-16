import { AsyncIteratorExecutor } from '@nx/devkit';
import chokidar, { FSWatcher } from 'chokidar';
import chalk from 'chalk';
import {
  NormalizedSiteConfig,
  ViteExecutorSchema,
} from '@landing-page-sdk/types';
import {
  resolveRoot,
  resolveProj,
  loadHMR,
  relative,
} from '@landing-page-sdk/utils-node';

type ExecutorMod = Awaited<typeof import('@landing-page-sdk/vite-executor')>;

const viteExecutor: AsyncIteratorExecutor<ViteExecutorSchema> =
  async function* (cliOptions, context) {
    // switch working dir
    process.chdir(resolveRoot(cliOptions.cwd));

    let main!: (...args: any[]) => Promise<boolean>;
    let teardown!: () => Promise<void>;
    let getSiteConfig!: () => NormalizedSiteConfig | null;

    const initMainMod = () => {
      const mod = loadHMR<ExecutorMod>('@landing-page-sdk/vite-executor');
      ({ main, teardown, getSiteConfig } = mod);
    };

    // 先跑一次
    initMainMod();
    yield { success: await main(cliOptions, context) };

    // build 模式單次就結束
    if (cliOptions.mode === 'build') return;

    let resolve!: (value?: unknown) => void;
    let plug!: Promise<any>;
    let watcher!: FSWatcher;

    const initPlug = () => {
      plug = new Promise((r) => {
        resolve = r;
      });
    };

    initPlug();

    const initWatcher = () => {
      const watchGlobs = [
        resolveProj('@landing-page-sdk/vite-executor'),
        resolveProj('@landing-page-sdk/utils-node'),
        cliOptions.config ?? 'site.config.js',
      ];

      const siteConfig = getSiteConfig();

      if (siteConfig) {
        const { i18n, sites } = siteConfig.sourcePath;
        watchGlobs.push(i18n, sites);
      }

      watcher = chokidar.watch(watchGlobs, {
        ignoreInitial: true,
      });

      // 監看事件，只負責發訊號
      // 用 on 處理，未來要看事件及對象判斷是否觸發 HMR
      watcher.on('all', (evt, file) => {
        file = relative(resolveRoot(), file);
        console.clear();
        timelog(
          'executor',
          chalk.green('program reload'),
          chalk.dim(`(${evt}: ${file})`)
        );
        resolve();
        initPlug();
      });
    };

    initWatcher();

    // HMR 迴圈
    while (true) {
      await plug; // 等待檔案變更訊號
      await watcher.close();
      await teardown();
      initMainMod();
      const success = await main(cliOptions, context);
      initWatcher(); // 待程序完成再跑 watcher，才能重讀 siteConfig
      yield { success };
    }
  };

export default viteExecutor;

function timelog(label: string, ...msgs: string[]) {
  const now = new Date().toLocaleTimeString();
  console.log(
    `${chalk.dim(now)} ${chalk.bold.cyanBright(`[${label}]`)}`,
    ...msgs
  );
}
