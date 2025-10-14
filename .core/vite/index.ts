import { AsyncIteratorExecutor, PromiseExecutor } from '@nx/devkit';
import chokidar from 'chokidar';
import { getPathFromRoot, getProjectPath } from '@landing-page-sdk/utils-node';
import { ViteExecutorSchema } from '@landing-page-sdk/types';
import path from 'node:path';
import fs from 'node:fs';
import url from 'node:url';

const viteExecutor: AsyncIteratorExecutor<ViteExecutorSchema> =
  async function* (cliOptions, context) {
    // switch working dir
    process.chdir(getPathFromRoot(cliOptions.cwd));

    let main!: (...args: any[]) => Promise<boolean>;
    let teardown!: () => Promise<void>;

    const initMainMod = async () => {
      // const fileUrl = getProjectPath(
      //   `@landing-page-sdk/vite-executor/index.ts`
      // );
      // const base = url.pathToFileURL(fileUrl);
      // const u = new URL(base.href);
      // u.searchParams.set('t', String(fs.statSync(fileUrl).mtimeMs | 0));
      const mod = await import('@landing-page-sdk/vite-executor');
      ({ main, teardown } = mod);
    };

    // 先跑一次
    await initMainMod();
    yield { success: await main(cliOptions, context) };

    // build 模式單次就結束
    if (cliOptions.mode === 'build') return;

    // ** 在沒找到怎麼清掉 import cache 問題之前，先卡住程式流 **
    await new Promise(() => {});

    const watchGlobs = [
      getProjectPath('@landing-page-sdk/vite-executor'),
      getProjectPath('@landing-page-sdk/utils-node'),
    ];

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
      console.log(
        `[executor] change detected (${evt}: ${file}) → reload program`
      );
      resolve();
      initPlug();
    });

    // --- 主迴圈：在 generator 本體中等待訊號、執行 main 並 yield ---
    while (true) {
      await plug; // 等待檔案變更訊號
      await teardown();
      await initMainMod();
      yield { success: await main(cliOptions, context) }; // ← 只能在這裡 yield
    }
  };

export default viteExecutor;
