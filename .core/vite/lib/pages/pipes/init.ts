import fsp from 'node:fs/promises';
import fg from 'fast-glob';
import { BuildPageOption } from '@landing-page-sdk/types';
import {
  resolve,
  resolveProj,
  join,
  relative,
  dirname,
} from '@landing-page-sdk/utils-node';
import { createPage, Page } from '../../common';

export default async function (buildPageOption: BuildPageOption): Promise<Page[]> {
  const { route: routeOpt, sourcePath, env } = buildPageOption.cfg;

  const root = resolve();

  // 掃描 src/pages/**/*.{html,ejs}
  const files = await fg(`${sourcePath.pages}/**/*.{html,ejs}`);

  if (!files.length) {
    throw new Error(
      `It must contain at least one template file (index.html or index.ejs) under ${sourcePath.pages}`
    );
  }

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
          const projPath = resolveProj(_path);
          let relPath = relative(resolve(), projPath);

          if (!relPath.startsWith('/')) {
            relPath = '/' + relPath;
          }

          return relPath;
        }

        return join('/', sourcePath.components, _path);
      },
      route: page.route,
    };

    return page;
  });

  return (await Promise.all(pagePromises)).filter((page) => !!page);
}
