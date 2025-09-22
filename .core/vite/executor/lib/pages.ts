import fs from 'node:fs';
import path from 'node:path';
import { readJsonFile } from '@nx/devkit';
import {
  cloneDeep,
  pick,
  merge,
  fromPairs,
  isBoolean,
  isObject,
  omit,
} from 'lodash-es';
import { getPath, getProjectPath } from '@landing-page-sdk/utils-node';
import {
  I18nInfo,
  SiteOptions,
  ViteExecutorSchema,
  Page,
  PagesInfo,
  RedirectOptions,
} from '@landing-page-sdk/types';
import { shadowData, scanDir, REGEXP, isHiddenFile } from './common';

interface PagesOptions
  extends Required<
      Pick<SiteOptions, 'routeMode' | 'sourcePath' | 'env' | 'redirect'>
    >,
    Pick<ViteExecutorSchema, 'mode' | 'sites'> {}

export default function createPages(
  cliOptions: ViteExecutorSchema,
  siteOptions: SiteOptions
): PagesInfo {
  const {
    sourcePath = {},
    routeMode = 'tree',
    env = {},
    redirect = false,
  } = siteOptions;

  const options = merge(
    { sourcePath, routeMode, env, redirect },
    pick(cliOptions, 'mode', 'sites')
  );

  const pages = findPages(options);
  const langInfo = localizePages(pages, options);
  const sites = multiSitesPages(pages, options);

  return { pages, langInfo, sites };
}

function findPages(options: PagesOptions) {
  const { routeMode, sourcePath, env } = options;
  const { pages: baseDir = './src/pages', components = './src/components' } =
    sourcePath;

  const root = getPath();
  const pages: Page[] = [];

  // 用 scanDir 掃描出所有 index.html / index.ejs（含子目錄）
  const hits = scanDir(baseDir, {
    match: REGEXP.TEMPLATE,
    recursive: true,
  });

  for (const file of hits) {
    // scanDir 只比對 name，保險起見仍確認「是檔案」
    if (!fs.statSync(file).isFile()) {
      continue;
    }

    const currentDir = path.dirname(file);
    const relDir = path.relative(baseDir, currentDir).replace(/\\/g, '/'); // '' 或 'about/contact'
    const name = relDir === '' ? 'index' : relDir.split('/').join(':');

    let filename!: string;

    if (routeMode === 'tree') {
      filename = (relDir ? relDir + '/' : '') + 'index.html';
    } else if (routeMode === 'flat') {
      filename = relDir ? relDir.replace(/\//g, '_') + '.html' : 'index.html';
    } else {
      throw new Error(`Unidentified route mode '${routeMode}'`);
    }

    // 將絕對路徑換成相對於 root 的 template 路徑
    const template = file.replace(root, '').replace(/^[/\\]/, '');

    // 尋找對應 main.js 作為可選 entry
    const entryPath = path.join(currentDir, 'main.js');
    let entry = fs.existsSync(entryPath)
      ? entryPath.replace(root, '')
      : undefined;
    if (entry && !entry.startsWith('/')) entry = `/${entry}`;

    // ejs data
    const data = {
      filename,
      env,
      $cmp: (_path: string) => {
        if (_path.startsWith('@')) {
          return getProjectPath(_path);
        }

        return path.join('/', components, _path);
      },
    };

    pages.push({
      name,
      route: relDir ? '/' + relDir : '/',
      filename,
      template,
      ...(entry && { entry }),
      data: shadowData(data),
    });
  }

  return pages;
}

function localizePages(pages: Page[], options: PagesOptions) {
  const { routeMode, sourcePath } = options;
  const { i18n: baseDir = './src/i18n' } = sourcePath;
  const redirect = normalizeRedirect(options.redirect);
  const files = scanDir(baseDir, { match: REGEXP.JSON });

  const langInfo: I18nInfo = {
    langs: [],
    langPack: {},
  };

  if (!files.length) {
    return langInfo;
  }

  for (const p of files) {
    if (!fs.statSync(p).isFile() || isHiddenFile(p)) {
      continue;
    }

    const lang = path.basename(p, '.json');
    const content = readJsonFile(p);
    langInfo.langs.push(lang);
    langInfo.langPack[lang] = content;
  }

  if (!langInfo.langs.length) {
    return langInfo;
  }

  const originalPages = [...pages];
  pages.length = 0; // in-place 清空

  const isMultiLang = langInfo.langs.length > 1;

  if (isMultiLang && redirect.enable) {
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
        langs: langInfo.langs,
        filename: 'index.html',
      }),
    });
  }

  let stubbed = false;
  for (const lang of langInfo.langs) {
    for (const _page of originalPages) {
      const page = cloneDeep(_page);

      let filename!: string;

      if (routeMode === 'tree') {
        filename = isMultiLang ? `${lang}/${page.filename}` : page.filename;
      } else if (routeMode === 'flat') {
        filename = isMultiLang
          ? page.filename.replace('.html', `_${lang}.html`)
          : page.filename;
      } else {
        throw new Error(`Unidentified route mode '${routeMode}'`);
      }

      page.name = isMultiLang ? `${lang}:${page.name}` : page.name;
      page.filename = filename;

      if (page.entry) {
        page.entry += page.entry?.includes('?')
          ? `&lang=${lang}`
          : `?lang=${lang}`;
      }

      page.data = shadowData(
        {
          filename: filename,
          lang: lang,
          langs: langInfo.langs,
          i18n: langInfo.langPack[lang],
        },
        page.data
      );
      pages.push(page);

      const notIndexPage = !_page.name.endsWith('index');

      if (
        !stubbed &&
        isMultiLang &&
        redirect.enable &&
        redirect.stub &&
        notIndexPage
      ) {
        pages.push({
          name: `${_page.name}:stub`,
          filename: _page.filename,
          template: getProjectPath(
            '@landing-page-sdk/assets/redirect/stub.html'
          ),
          entry: getProjectPath('@landing-page-sdk/assets/redirect/stub.ts'),
          data: shadowData({
            filename: _page.filename,
            lang,
            langs: langInfo.langs,
            i18n: langInfo.langPack[lang],
          }),
        });
      }
    }

    stubbed = true;
  }

  return langInfo;
}

function multiSitesPages(pages: Page[], options: PagesOptions) {
  const { sourcePath, sites: _requiredSites, mode } = options;
  const { sites: baseDir = './src/sites' } = sourcePath;

  const files = scanDir(baseDir, { match: REGEXP.SCRIPT });

  if (!files.length) {
    return {};
  }

  const requiredSites = _requiredSites?.split(',');
  const sites = files
    .filter((p) => !isHiddenFile(p))
    .map((p) => {
      const _path = p.startsWith('/') ? p : `/${p}`;
      const [name, alias = ''] = path.parse(_path).name.split('.');

      return { path: _path, name, alias };
    })
    .filter(({ name }) =>
      requiredSites?.length ? requiredSites.includes(name) : true
    );

  if (!sites.length) {
    return {};
  }

  const originalPages = [...pages];
  pages.length = 0; // in-place 清空

  for (const { path: sitePath, name, alias } of sites) {
    for (const _page of originalPages) {
      const page = cloneDeep(_page);
      const filename = `${mode === 'dev' && alias ? alias : name}/${
        page.filename
      }`;
      page.name = `${name}:${page.name}`;
      page.filename = filename;

      const redirectPage = page.name.endsWith('redirect');
      const stubPage = page.name.endsWith('stub');

      if (page.entry && !redirectPage && !stubPage) {
        const entryDir = path.parse(page.entry).dir;
        page.siteScript = path.relative(entryDir, sitePath);

        if (page.entry) {
          page.entry += page.entry?.includes('?')
            ? `&site=${name}`
            : `?site=${name}`;
        }
      }

      page.data = shadowData(
        {
          site: name,
          alias,
        },
        page.data
      );
      pages.push(page);
    }
  }

  const siteInfo = fromPairs(sites.map((item) => [item.name, item.alias]));

  return siteInfo;
}

function normalizeRedirect(
  redirect: boolean | RedirectOptions
): Omit<Required<RedirectOptions>, 'transform' | 'defaultLang'> {
  const opts: Omit<Required<RedirectOptions>, 'transform' | 'defaultLang'> = {
    enable: true,
    stub: false,
  };

  if (isBoolean(redirect)) {
    opts.enable = redirect;
    opts.stub = redirect;
  } else if (isObject(redirect)) {
    merge(opts, omit(redirect, 'transform'));
  }

  return opts;
}
