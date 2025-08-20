import fs from 'node:fs';
import path from 'node:path';
import { cloneDeep } from 'lodash-es';
import {
  I18nInfo,
  RouteMode,
  SiteOptions,
  ViteExecutorSchema,
  type Page,
} from './types';
import { shadowData, scanDir, REGEXP, loadLangs, loadSites } from './common';
import VirtualAssets from './virtual-assets';
import { getPath, getProjectPath } from '@landing-page-sdk/utils-node';
import { pick, merge } from 'lodash-es';

interface PagesOptions
  extends Required<Pick<SiteOptions, 'routeMode' | 'sourcePath'>>,
    Pick<ViteExecutorSchema, 'mode'> {}

export default function createPages(
  cliOptions: ViteExecutorSchema,
  siteOptions: SiteOptions
) {
  const { sourcePath = {}, routeMode = 'tree' } = siteOptions;
  const options = merge({ sourcePath, routeMode }, pick(cliOptions, 'mode'));
  const pages = findPages(options);
  localizePages(pages, options);
  multiSitesPages(pages, options);
  return pages;
}

function findPages(options: PagesOptions) {
  const { routeMode, sourcePath } = options;
  const { pages: baseDir = './src/pages' } = sourcePath;
  const root = getPath();
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

    let filename!: string;
    if (routeMode === 'tree') {
      filename = (relDir ? relDir + '/' : '') + 'index.html';
    } else if (routeMode === 'flat') {
      filename = relDir ? relDir.replace(/\//g, '_') + '.html' : 'index.html';
    } else throw new Error(`Unidentified route mode '${routeMode}'`);

    // 將絕對路徑換成相對於 root 的 template 路徑
    const template = file.replace(root, '').replace(/^[/\\]/, '');

    // 尋找對應 main.js 作為可選 entry
    const entryPath = path.join(currentDir, 'main.js');
    let entry = fs.existsSync(entryPath)
      ? entryPath.replace(root, '')
      : undefined;
    if (entry && !entry.startsWith('/')) entry = `/${entry}`;

    pages.push({
      name,
      filename,
      template,
      ...(entry && { entry }),
      data: shadowData({ filename }),
    });
  }

  return pages;
}

function localizePages(pages: Page[], options: PagesOptions) {
  const { routeMode, sourcePath } = options;
  const { i18n: baseDir = './src/i18n' } = sourcePath;
  const { langs, langPack } = loadLangs(baseDir);

  if (!langs.length) return;

  const originalPages = [...pages];
  pages.length = 0; // in-place 清空

  const isMultiLang = langs.length > 1;

  if (isMultiLang || routeMode === 'flat') {
    // 加上 redirect 頁（根目錄跳轉）
    pages.push({
      name: 'redirect',
      filename: 'index.html',
      template: getProjectPath('@landing-page-sdk/assets/redirect/index.html'),
      entry: getProjectPath(
        `@landing-page-sdk/assets/redirect/${routeMode}.ts`
      ),
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
      let filename!: string;
      if (routeMode === 'tree') {
        filename = isMultiLang ? `${lang}/${page.filename}` : page.filename;
      } else if (routeMode === 'flat') {
        filename = page.filename.replace('.html', `_${lang}.html`);
      } else throw new Error(`Unidentified route mode '${routeMode}'`);
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

function multiSitesPages(pages: Page[], options: PagesOptions) {
  const { sourcePath } = options;
  const { sites: baseDir = './src/sites' } = sourcePath;
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

      const redirectPage = page.name.endsWith('redirect');

      if (page.entry && !redirectPage) {
        const entryDir = path.parse(page.entry).dir;
        page.siteScript = path.relative(entryDir, site);
        page.entry = page.entry + `?site=${siteName}`;
      }

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
