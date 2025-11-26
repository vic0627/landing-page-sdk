import path from 'node:path';
import { BuildPageOption } from '@landing-page-sdk/types';
import { isHiddenFile, scanDir } from '@landing-page-sdk/utils-node';
import { Page, SCRIPT } from '../../common';

export default async function (buildPageOption: BuildPageOption, pages: Page[]): Promise<string[]> {
  const { sites: _requiredSites } = buildPageOption.cli;
  const { sourcePath } = buildPageOption.cfg;

  // 掃描 src/sites/*.{js,ts}
  const files = await scanDir(sourcePath.sites, { match: SCRIPT });

  if (!files.length) {
    return [];
  }

  const requiredSites = _requiredSites?.split(',');
  const sites = files
    .map((p) => {
      const _path = p.startsWith('/') ? p : `/${p}`;
      const name = path.parse(_path).name;
      const keep =
        !isHiddenFile(p) && (requiredSites?.length ? requiredSites.includes(name) : true);

      return keep && { path: _path, name };
    })
    .filter((x) => !!x);

  if (!sites.length) {
    return [];
  }

  const originalPages = [...pages];
  pages.length = 0; // in-place 清空

  for (const { path: filePath, name } of sites) {
    for (const _page of originalPages) {
      const page = await _page.clone();

      const { lang, langs } = _page.data ?? {};
      if (lang && langs && !page.isStub()) {
        page.localize(lang, langs);
      }

      page.diversify({ filePath, name });
      page.data = {
        filename: page.filename,
        site: name,
      };
      pages.push(page);
    }
  }

  return sites.map((item) => item.name);
}
