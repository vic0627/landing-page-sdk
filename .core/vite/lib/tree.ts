import fs from 'node:fs';
import path from 'node:path';
import { cloneDeep } from 'lodash-es';
import { I18nInfo, type Page } from './types';
import { shadowData, scanDir, REGEXP, loadLangs, loadSites } from './common';
import { getPath } from '@landing-page-sdk/utils-node';

export function findPages(baseDir: string) {
  const root = getPath(); // 保留你原本取得專案根目錄的方式
  const pages: Page[] = [];

  // 用 scanDir 掃描出所有 index.html / index.ejs（含子目錄）
  const hits = scanDir(baseDir, {
    match: REGEXP.TEMPLATE,
    recursive: true,
  });

  for (const file of hits) {
    // scanDir 只比對 name，保險起見仍確認「是檔案」
    if (!fs.statSync(file).isFile()) continue;

    const currentDir = path.dirname(file);
    const relDir = path.relative(baseDir, currentDir).replace(/\\/g, '/'); // '' 或 'about/contact'

    const name = relDir === '' ? 'index' : relDir.split('/').join(':');
    const filename = (relDir ? relDir + '/' : '') + 'index.html';

    // 將絕對路徑換成相對於 root 的 template 路徑
    const template = file.replace(root, '').replace(/^[/\\]/, '');

    // 尋找對應 main.js 作為可選 entry
    const entryPath = path.join(currentDir, 'main.js');
    const entry = fs.existsSync(entryPath)
      ? entryPath.replace(root, '')
      : undefined;

    pages.push({
      name,
      filename,
      template,
      ...(entry && { entry }),
      data: shadowData({ filename }),
    });
  }

  // 可選的排序策略
  pages.sort((a, b) => a.filename.localeCompare(b.filename));
  return pages;
}

export function localizePages(baseDir: string, pages: Page[]) {
  const { langs, langPack } = loadLangs(baseDir);

  if (!langs.length) return;

  const originalPages = [...pages];
  pages.length = 0; // in-place 清空

  const isMultiLang = langs.length > 1;

  if (isMultiLang) {
    // 加上 redirect 頁（根目錄跳轉）
    pages.push({
      name: 'redirect',
      filename: 'index.html',
      template: 'src/redirect/index.html',
      data: shadowData({
        ...originalPages[0].data,
        langs,
        filename: 'index.html',
      }),
    });
  }

  for (const lang of langs) {
    for (const _page of originalPages) {
      const page = cloneDeep(_page);
      const filename = isMultiLang ? `${lang}/${page.filename}` : page.filename;
      page.name = isMultiLang ? `${lang}:${page.name}` : page.name;
      page.filename = filename;
      page.data = shadowData(
        {
          filename: filename,
          lang: lang,
          langs: langs,
          i18n: langPack[lang],
        },
        page.data
      );
      pages.push(page);
    }
  }
}

export function multiSitesPages(baseDir: string, pages: Page[]) {
  const sites = loadSites(baseDir);

  if (!sites.length) return;

  const originalPages = [...pages];
  pages.length = 0; // in-place 清空

  for (const site of sites) {
    const siteName = path.parse(site).name;

    for (const _page of originalPages) {
      const page = cloneDeep(_page);
      const filename = `${siteName}/${page.filename}`;
      page.name = `${siteName}:${page.name}`;
      page.filename = filename;
      page.siteScript = site;
      page.data = shadowData(
        {
          site: siteName,
        },
        page.data
      );
      pages.push(page);
    }
  }
}
