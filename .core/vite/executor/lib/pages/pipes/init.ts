import fsp from 'node:fs/promises';
import { BuildPageOption, Page } from '@landing-page-sdk/types';
import {
  getPath,
  getProjectPath,
  join,
  relative,
  scanDir,
  dirname,
} from '@landing-page-sdk/utils-node';
import { REGEXP, shadowData } from '../../common';

export default async function (
  buildPageOption: BuildPageOption
): Promise<Page[]> {
  const { route: routeOpt, sourcePath, env } = buildPageOption.cfg;

  const root = getPath();

  // 用 scanDir 掃描出所有 index.html / index.ejs（含子目錄）
  const files = await scanDir(sourcePath.pages, {
    match: REGEXP.TEMPLATE,
    recursive: true,
  });

  const pagePromises = files.map(async (file) => {
    if (!(await fsp.stat(file)).isFile()) return;

    const currentDir = dirname(file);
    let relDir = relative(sourcePath.pages, currentDir); // '.' 或 'about/contact'

    // 主頁特規處理
    if (relDir === '.') {
      relDir = '';
    }

    const name = relDir
      ? relDir.split('/').join(':') // 其餘頁面
      : 'index'; // 主頁
    const route = relDir ? '/' + relDir : '/';

    let filename!: string;

    if (routeOpt.mode === 'tree') {
      filename = (relDir ? relDir + '/' : '') + 'index.html';
    } else if (routeOpt.mode === 'flat') {
      filename = routeOpt.flatFileNaming('init', relDir || 'index') + '.html';
    }

    const rootFilename = join('/', filename);
    // 將絕對路徑換成相對於 root 的 template 路徑
    const template = file.replace(root, '').replace(/^[/\\]/, '');
    // 尋找對應入口作為可選 entry
    const entryJs = join(currentDir, 'main.js');
    const entryTs = join(currentDir, 'main.ts');
    let entry: string | undefined;
    try {
      await fsp.access(entryJs);
      entry = entryJs;
    } catch {
      try {
        await fsp.access(entryTs);
        entry = entryTs;
      } catch {}
    }

    if (entry && !entry.startsWith('/')) {
      entry = `/${entry}`;
    }

    // ejs data
    const data = {
      filename,
      env,
      $cmp: (_path: string) => {
        if (_path.startsWith('@')) {
          return getProjectPath(_path);
        }

        return join('/', sourcePath.components, _path);
      },
    };

    return {
      name,
      route,
      filename,
      rootFilename,
      template,
      ...(entry && { entry }),
      data: shadowData(data),
    } as Page;
  });

  return (await Promise.all(pagePromises)).filter((page) => !!page);
}
