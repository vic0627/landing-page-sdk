import fs from 'node:fs';
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

export default function (buildPageOption: BuildPageOption): Page[] {
  const { route: routeOpt, sourcePath, env } = buildPageOption.cfg;

  const root = getPath();
  const pages: Page[] = [];

  // 用 scanDir 掃描出所有 index.html / index.ejs（含子目錄）
  const files = scanDir(sourcePath.pages, {
    match: REGEXP.TEMPLATE,
    recursive: true,
  });

  for (const file of files) {
    // scanDir 只比對 name，保險起見仍確認「是檔案」
    if (!fs.statSync(file).isFile()) {
      continue;
    }

    const currentDir = dirname(file);
    const relDir = relative(sourcePath.pages, currentDir); // '' 或 'about/contact'
    const name =
      relDir === ''
        ? 'index' // 主頁
        : relDir.split('/').join(':'); // 其餘頁面
    const route = relDir ? '/' + relDir : '/';

    let filename!: string;

    if (routeOpt.mode === 'tree') {
      filename = (relDir ? relDir + '/' : '') + 'index.html';
    } else if (routeOpt.mode === 'flat') {
      filename = relDir ? routeOpt.flatFileNaming(relDir) : 'index.html';
    }

    // 將絕對路徑換成相對於 root 的 template 路徑
    const template = file.replace(root, '').replace(/^[/\\]/, '');

    // 尋找對應入口作為可選 entry
    const entryJs = join(currentDir, 'main.js');
    const entryTs = join(currentDir, 'main.ts');
    let entry = fs.existsSync(entryJs)
      ? entryJs.replace(root, '')
      : fs.existsSync(entryTs)
      ? entryTs.replace(root, '')
      : undefined;

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

    pages.push({
      name,
      route,
      filename,
      template,
      ...(entry && { entry }),
      data: shadowData(data),
    });
  }

  return pages;
}
