import path from 'node:path';
import { fromPairs } from 'lodash-es';
import { BuildPageOption } from '@landing-page-sdk/types';
import { isHiddenFile, scanDir } from '@landing-page-sdk/utils-node';
import { REGEXP, Page } from '../../common';

export default async function (
  buildPageOption: BuildPageOption,
  pages: Page[]
): Promise<Record<string, string>> {
  const { sites: _requiredSites, mode } = buildPageOption.cli;
  const { sourcePath } = buildPageOption.cfg;

  // 掃描 src/sites/*.{js,ts}
  const files = await scanDir(sourcePath.sites, { match: REGEXP.SCRIPT });

  if (!files.length) {
    return {};
  }

  const requiredSites = _requiredSites?.split(',');
  const duplicate: string[] = [];
  const checkDuplicate = (x: string) => {
    if (duplicate.includes(x)) {
      throw new Error(`Duplicate name or alias in sites: '${x}'`);
    }

    duplicate.push(x);
  };
  const sites = files
    .map((p) => {
      const _path = p.startsWith('/') ? p : `/${p}`;
      const [name, alias = ''] = path.parse(_path).name.split('.');
      const keep =
        !isHiddenFile(p) &&
        (requiredSites?.length ? requiredSites.includes(name) : true);

      checkDuplicate(name);
      alias && checkDuplicate(alias);

      return keep && { path: _path, name, alias };
    })
    .filter((x) => !!x);

  if (!sites.length) {
    return {};
  }

  const originalPages = [...pages];
  pages.length = 0; // in-place 清空

  for (const { path: filePath, name, alias } of sites) {
    for (const _page of originalPages) {
      const page = await _page.cloneWithSite({ mode, filePath, name, alias });
      page.data = {
        filename: page.filename,
        site: name,
        alias,
      };
      pages.push(page);
    }
  }

  const siteInfo = fromPairs(sites.map((item) => [item.name, item.alias]));

  return siteInfo;
}
