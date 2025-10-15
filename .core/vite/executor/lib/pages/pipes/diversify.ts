import path from 'node:path';
import { fromPairs } from 'lodash-es';
import { BuildPageOption, Page } from '@landing-page-sdk/types';
import { isHiddenFile, scanDir, relative } from '@landing-page-sdk/utils-node';
import { REGEXP, shadowData } from '../../common';

export default async function (
  buildPageOption: BuildPageOption,
  pages: Page[]
): Promise<Record<string, string>> {
  const { sites: _requiredSites, mode } = buildPageOption.cli;
  const { sourcePath } = buildPageOption.cfg;

  const files = await scanDir(sourcePath.sites, { match: REGEXP.SCRIPT });

  if (!files.length) {
    return {};
  }

  const requiredSites = _requiredSites?.split(',');
  const sites = files
    .map((p) => {
      const _path = p.startsWith('/') ? p : `/${p}`;
      const [name, alias = ''] = path.parse(_path).name.split('.');
      const keep =
        !isHiddenFile(p) &&
        (requiredSites?.length ? requiredSites.includes(name) : true);

      return keep && { path: _path, name, alias };
    })
    .filter((x) => !!x);

  if (!sites.length) {
    return {};
  }

  const originalPages = [...pages];
  pages.length = 0; // in-place 清空

  for (const { path: sitePath, name, alias } of sites) {
    for (const _page of originalPages) {
      // const page = cloneDeep(_page);
      const page = { ..._page };
      const filename = `${mode === 'dev' && alias ? alias : name}/${
        page.filename
      }`;
      page.name = `${name}:${page.name}`;
      page.filename = filename;

      const redirectPage = page.name.endsWith('redirect');
      const stubPage = page.name.endsWith('stub');

      if (page.entry && !redirectPage && !stubPage) {
        const entryDir = path.parse(page.entry).dir;
        page.siteScript = relative(entryDir, sitePath);

        if (page.entry) {
          page.entry += `${page.entry?.includes('?') ? '&' : '?'}site=${name}`;
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
