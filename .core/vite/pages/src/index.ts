import path from 'node:path';
import fs from 'node:fs';
import { cloneDeep } from 'lodash-es';
import { type Page } from './types';
import { type RewriteRule } from 'vite-plugin-virtual-mpa';

export const rewrites: RewriteRule = [
  {
    from: /^\/src\/pages.*$/, // all requests from /src/pages
    to: '',
  },
  {
    from: /^\/?$/, // '' or '/'
    to: '/index.html',
  },
  {
    from: /^\/?(.*)\/?$/, // '/about', 'about/', '/about/', etc.
    to: ({ match }) => {
      const path = match[1].replace(/\/$/, '');
      return path === '' ? '/index.html' : `/${path}/index.html`;
    },
  },
];

export function usePageData(
  data: Record<string, any>,
  base: Record<string, any> = {}
) {
  const result = { ...base, ...data };
  result['_data'] = result;
  return result;
}

export function injectDataToPages(
  pages: Page[],
  data: Record<string, any> = {}
) {
  for (const page of pages) {
    page.data = usePageData(data, page.data);
  }
}

export function findPages(baseDir: string, root: string) {
  const pages: Page[] = [];

  function walk(currentDir: string) {
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const ent of items) {
      const full = path.join(currentDir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile() && /index\.(html|ejs)$/i.test(ent.name)) {
        const relDir = path.relative(baseDir, currentDir).replace(/\\/g, '/'); // '' 或 'about/contact'
        const name = relDir === '' ? 'index' : relDir.split('/').join(':');
        const filename = (relDir === '' ? '' : relDir + '/') + 'index.html';
        const template = full.replace(root, '').slice(1);

        /** Optionally check for a corresponding main.js entry */
        const entryPath = path.join(currentDir, 'main.js');
        const entry = fs.existsSync(entryPath)
          ? entryPath.replace(root, '')
          : undefined;
        pages.push({
          name,
          filename,
          template,
          ...(entry && { entry }),
          data: usePageData({ filename }),
        });
      }
    }
  }

  walk(baseDir);
  // optional sort by filename or name
  pages.sort((a, b) => a.filename.localeCompare(b.filename));
  return pages;
}

export function loadLangs(dir: string) {
  if (!fs.existsSync(dir)) return { langs: [], langPack: {} };

  const files = fs.readdirSync(dir);
  const langs: string[] = [];
  const langPack: Record<string, string> = {};

  for (const file of files) {
    if (path.extname(file) === '.json') {
      const lang = path.basename(file, '.json'); // 拿掉 .json
      const json = path.join(dir, file);
      const content = JSON.parse(fs.readFileSync(json, 'utf-8'));

      langs.push(lang);
      langPack[lang] = content;
    }
  }

  return { langs, langPack };
}

export function decoratePagesByLangs(
  pages: Page[],
  langPack: Record<string, string>,
  langs: string[]
) {
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
      data: usePageData({
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
      page.data = usePageData(
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
