import fsp from 'node:fs/promises';
import { BuildPageOption } from '@landing-page-sdk/types';
import {
  resolve,
  resolveProj,
  join,
  relative,
  scanDir,
  dirname,
} from '@landing-page-sdk/utils-node';
import { REGEXP, createPage, Page } from '../../common';

export default async function (
  buildPageOption: BuildPageOption
): Promise<Page[]> {
  const { route: routeOpt, sourcePath, env } = buildPageOption.cfg;

  const root = resolve();

  // 掃描 src/pages/**/*.{html,ejs}
  const files = await scanDir(sourcePath.pages, {
    match: REGEXP.TEMPLATE,
    recursive: true,
  });

  const pagePromises = files.map(async (file) => {
    if (!(await fsp.stat(file)).isFile()) return;

    const currentDir = dirname(file);
    const template = file.replace(root, '').replace(/^[/\\]/, ''); // 將絕對路徑換成相對於 root 的 template 路徑
    let relDir = relative(sourcePath.pages, currentDir); // '.' 或 'about/contact'

    // 主頁特規處理
    if (relDir === '.') {
      relDir = '';
    }

    const page = await createPage({
      routeMode: routeOpt.mode,
      template,
      relDir,
      currentDir,
    });
    page.data = {
      filename: page.filename,
      env,
      $cmp: (_path: string) => {
        if (_path.startsWith('@')) {
          return resolveProj(_path);
        }

        return join('/', sourcePath.components, _path);
      },
    };

    return page;
  });

  return (await Promise.all(pagePromises)).filter((page) => !!page);
}
