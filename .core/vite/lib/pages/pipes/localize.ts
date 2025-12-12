import fg from 'fast-glob';
import { readJsonFile } from '@nx/devkit';
import { BuildPageOption, I18nInfo, I18nLangPack } from '@landing-page-sdk/types';
import { basename } from '@landing-page-sdk/utils-node';
import { createRedirectPage, createStubPage, Page } from '../../common';

export default async function (buildPageOption: BuildPageOption, pages: Page[]): Promise<I18nInfo> {
  const { route, sourcePath, redirect } = buildPageOption.cfg;

  // 掃描 src/i18n/*.json
  const files = await fg(`${sourcePath.i18n}/**/*.json`);
  const langInfo: I18nInfo = {
    langs: [],
    langPack: {},
  };

  if (!files.length) {
    return langInfo;
  }

  // 語言包資訊初始化
  for (const file of files) {
    const [lang, isDefault] = basename(file, '.json').split('.');

    if (isDefault) {
      if (!langInfo.defaultLang) {
        langInfo.defaultLang = lang;
      } else {
        throw new Error(
          `Multiple default language files found: ${langInfo.defaultLang} and ${lang}`
        );
      }
    }

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
  const treeMode = route.mode === 'tree';

  // 加上根目錄跳轉頁（redirect）
  if (isMultiLang && redirect.enable) {
    const redirectPage = await createRedirectPage({
      routeMode: route.mode,
    });
    redirectPage.data = {
      ...originalPages[0].data,
      langs: langInfo.langs,
      defaultLang: langInfo.defaultLang,
      filename: redirectPage.filename,
    };
    pages.push(redirectPage);
  }

  let stubbed = false;
  for (const lang of langInfo.langs) {
    for (const originalPage of originalPages) {
      const langData = {
        lang,
        defaultLang: langInfo.defaultLang,
        langs: langInfo.langs,
        i18nPack: langInfo.langPack,
        i18n: langInfo.langPack[lang] as I18nLangPack,
      };

      const page = await originalPage.clone();
      page.localize(lang, langInfo.langs);
      page.data = {
        filename: page.filename,
        ...langData,
      };
      pages.push(page);

      const notIndexPage = !originalPage.name.endsWith('index');

      // 加上各路徑語系轉導頁（stub）
      if (!stubbed && isMultiLang && redirect.enable && redirect.stub && treeMode && notIndexPage) {
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
