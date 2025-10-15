import fsp from 'node:fs/promises';
import { readJsonFile } from '@nx/devkit';
import {
  BuildPageOption,
  I18nInfo,
  I18nLangPack,
  Page,
} from '@landing-page-sdk/types';
import {
  basename,
  getProjectPath,
  isHiddenFile,
  join,
  scanDir,
} from '@landing-page-sdk/utils-node';
import { REGEXP, shadowData } from '../../common';

export default async function (
  buildPageOption: BuildPageOption,
  pages: Page[]
): Promise<I18nInfo> {
  const { route, sourcePath, redirect } = buildPageOption.cfg;

  const rawFiles = await scanDir(sourcePath.i18n, { match: REGEXP.JSON });
  const predicates = await Promise.all(
    rawFiles.map(
      async (raw) => (await fsp.stat(raw)).isFile() && !isHiddenFile(raw)
    )
  );
  const files = rawFiles.filter((_, i) => predicates[i]);

  const langInfo: I18nInfo = {
    langs: [],
    langPack: {},
  };

  if (!files.length) {
    return langInfo;
  }

  // 語言包資訊初始化
  for (const file of files) {
    const lang = basename(file, '.json');
    const content = readJsonFile(file);
    langInfo.langs.push(lang);
    langInfo.langPack[lang] = content;
  }

  if (!langInfo.langs.length) {
    return langInfo;
  }

  const originalPages = [...pages];
  pages.length = 0; // in-place 清空

  const isMultiLang = langInfo.langs.length > 1;

  // 加上根目錄跳轉頁（redirect）
  if (isMultiLang && redirect.enable) {
    pages.push({
      name: 'redirect',
      filename: 'index.html',
      rootFilename: '/index.html',
      template: getProjectPath('@landing-page-sdk/assets/redirect/index.html'),
      entry: getProjectPath(
        `@landing-page-sdk/assets/redirect/${route.mode}.ts`
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
      // const page = cloneDeep(_page);
      const page = { ..._page };

      let filename!: string;

      if (route.mode === 'tree') {
        filename = isMultiLang ? `${lang}/${page.filename}` : page.filename;
        page.rootFilename = join('/', lang, page.rootFilename);
      } else if (route.mode === 'flat') {
        filename = isMultiLang
          ? page.filename.replace('.html', `_${lang}.html`)
          : page.filename;
        page.rootFilename = join('/', filename);
      }

      page.name = isMultiLang ? `${lang}:${page.name}` : page.name;
      page.filename = filename;

      if (page.entry) {
        page.entry += `${page.entry.includes('?') ? '&' : '?'}lang=${lang}`;
      }

      page.data = shadowData(
        {
          filename: filename,
          lang: lang,
          langs: langInfo.langs,
          i18n: langInfo.langPack[lang] as I18nLangPack,
        },
        page.data
      );
      pages.push(page);

      const notIndexPage = !_page.name.endsWith('index');

      // 加上各路徑語系轉導頁（stub）
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
          rootFilename: join('/', _page.filename),
          template: getProjectPath(
            '@landing-page-sdk/assets/redirect/stub.html'
          ),
          entry: getProjectPath('@landing-page-sdk/assets/redirect/stub.ts'),
          data: shadowData({
            filename: _page.filename,
            lang,
            langs: langInfo.langs,
            i18n: langInfo.langPack[lang] as I18nLangPack,
          }),
        });
      }
    }

    stubbed = true;
  }

  return langInfo;
}
