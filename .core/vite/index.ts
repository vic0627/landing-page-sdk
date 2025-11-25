import { AsyncIteratorExecutor } from '@nx/devkit';
import chalk from 'chalk';
import { NormalizedSiteConfig, ViteExecutorSchema } from '@landing-page-sdk/types';
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

const viteExecutor: AsyncIteratorExecutor<ViteExecutorSchema> = async function* (
  cliOption,
  context
) {
  // Switch working directory to the workspace root resolved from CLI option
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

  // Perform first run for the current config/module state
  initMainMod();

  yield { success: await runMod() };

  // In build mode we only run once and exit
  if (cliOption.mode === 'build') return;

  isFirstProcess = false;
  Plug.init();

  const initWatcher = () => {
    // do not enable HMR in preview mode
    if (cliOption.mode === 'preview') return;

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
        { name: 'main', ext: ['.js', '.ts', '.jsx', '.tsx'] }
      ),
    });

    // Watcher only emits change signals; future logic can decide when to trigger HMR per event/target
    Watcher.on((evt, file) => {
      file = relative(resolveRoot(), file);
      console.clear();
      timelog('executor', chalk.green('program reload'), chalk.dim(`(${evt}: ${file})`));
      Plug.init();
    });
  };

  initWatcher();

  // HMR loop: wait for changes, then reload executor + config
  while (true) {
    await Plug.plug; // Wait for file change signal
    await Watcher.destroy();
    await teardown();
    initMainMod();
    const success = await runMod();
    initWatcher(); // Restart watcher after run completes
    yield { success };
  }
};

export default viteExecutor;

function timelog(label: string, ...msgs: string[]) {
  const now = new Date().toLocaleTimeString();
  console.log(`${chalk.dim(now)} ${chalk.bold.cyanBright(`[${label}]`)}`, ...msgs);
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
