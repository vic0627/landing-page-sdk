import fsp from 'node:fs/promises';
import { readJsonFile } from '@nx/devkit';
import {
  BuildPageOption,
  I18nInfo,
  I18nLangPack,
} from '@landing-page-sdk/types';
import { basename, isHiddenFile, scanDir } from '@landing-page-sdk/utils-node';
import { createRedirectPage, createStubPage, Page, JSON } from '../../common';

export default async function (
  buildPageOption: BuildPageOption,
  pages: Page[]
): Promise<I18nInfo> {
  const { route, sourcePath, redirect } = buildPageOption.cfg;

  // 掃描 src/i18n/*.json
  const rawFiles = await scanDir(sourcePath.i18n, { match: JSON });
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
    const content = readJsonFile<I18nLangPack>(file);
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
    const redirectPage = await createRedirectPage({
      routeMode: route.mode,
    });
    redirectPage.data = {
      ...originalPages[0].data,
      langs: langInfo.langs,
      filename: redirectPage.filename,
    };
    pages.push(redirectPage);
  }

  let stubbed = false;
  for (const lang of langInfo.langs) {
    for (const originalPage of originalPages) {
      const langData = {
        lang,
        defaultLang: redirect.defaultLang,
        langs: langInfo.langs,
        i18n: langInfo.langPack[lang] as I18nLangPack,
      };

      const page = await originalPage.cloneWithLang(lang, langInfo.langs);
      page.data = {
        filename: page.filename,
        ...langData,
      };
      pages.push(page);

      const notIndexPage = !originalPage.name.endsWith('index');

      // 加上各路徑語系轉導頁（stub）
      if (
        !stubbed &&
        isMultiLang &&
        redirect.enable &&
        redirect.stub &&
        notIndexPage
      ) {
        const stubPage = await createStubPage({
          name: originalPage.name,
          filename: originalPage.filename,
          routeMode: route.mode,
        });
        stubPage.data = {
          filename: originalPage.filename,
          ...langData,
        };
        pages.push(stubPage);
      }
    }

    stubbed = true;
  }

  return langInfo;
}
