import { AsyncIteratorExecutor } from '@nx/devkit';
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
  resolve as resolveCwd,
} from '@landing-page-sdk/utils-node';
import { Plug, Watcher } from '@landing-page-sdk/vite-executor/hmr';
import { readRaw, normalize } from '@landing-page-sdk/vite-executor/config';
import { statSync } from 'node:fs';

type ExecutorMod = Awaited<typeof import('@landing-page-sdk/vite-executor')>;

const viteExecutor: AsyncIteratorExecutor<ViteExecutorSchema> =
  async function* (cliOption, context) {
    // switch working dir
    process.chdir(resolveRoot(cliOption.cwd));

    let main!: ExecutorMod['main'];
    let teardown!: ExecutorMod['teardown'];
    let siteConfig!: NormalizedSiteConfig;
    let isFirstProcess = true;

    const configFile = getConfigFile(cliOption.config);

    const initMainMod = () => {
      const rawConfig = readRaw(configFile);
      siteConfig = normalize(rawConfig);
      const mod = loadHMR<ExecutorMod>('@landing-page-sdk/vite-executor');
      if (mod) {
        ({ main, teardown } = mod);
      }
    };

    const runMod = async () => {
      try {
        return await main({ siteConfig, cliOption, context, isFirstProcess });
      } catch (error) {
        console.error(error);
        return false;
      }
    };

    // 先跑一次
    initMainMod();

    yield { success: await runMod() };

    // build 模式單次就結束
    if (cliOption.mode === 'build') return;

    isFirstProcess = false;
    Plug.init();

    const initWatcher = () => {
      Watcher.set(resolveProj('@landing-page-sdk/vite-executor'));
      Watcher.set(resolveProj('@landing-page-sdk/utils-node'));
      Watcher.set(resolveCwd(configFile), {
        evt: ['add', 'change', 'unlink'],
      });

      const { i18n, sites, pages } = siteConfig.sourcePath;

      Watcher.set(resolveCwd(i18n), {
        evt: ['add', 'change', 'unlink'],
        matcher: Watcher.createFileMatcher({ ext: ['.json'] }),
      });
      Watcher.set(resolveCwd(sites), {
        evt: ['add', 'unlink'],
        matcher: Watcher.createFileMatcher({ ext: ['.js', '.ts'] }),
      });
      Watcher.set(resolveCwd(pages), {
        evt: ['add', 'unlink'],
        matcher: Watcher.createFileMatcher(
          { name: 'index', ext: ['.html', '.ejs'] },
          { name: 'main', ext: ['.js', '.ts'] }
        ),
      });

      // 監看事件，只負責發訊號
      // 用 on 處理，未來要看事件及對象判斷是否觸發 HMR
      Watcher.on((evt, file) => {
        file = relative(resolveRoot(), file);
        console.clear();
        timelog(
          'executor',
          chalk.green('program reload'),
          chalk.dim(`(${evt}: ${file})`)
        );
        Plug.init();
      });
    };

    initWatcher();

    // HMR 迴圈
    while (true) {
      await Plug.plug; // 等待檔案變更訊號
      await Watcher.destroy();
      await teardown();
      initMainMod();
      const success = await runMod();
      initWatcher(); // 待程序完成再跑 watcher
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

function getConfigFile(config?: string): string {
  const defaults = ['site.config.ts', 'site.config.js'];

  if (config) {
    return config;
  }

  const foundDefault = defaults.find((name) => {
    try {
      return statSync(resolveCwd(name)).isFile();
    } catch {
      return false; // File does not exist or is not a file
    }
  });

  return foundDefault || defaults[defaults.length - 1]; // Fallback to 'site.config.js' if neither are found
}
