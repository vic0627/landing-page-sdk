import {
  PagesInfo,
  RouteManifest,
  RouteMapKey,
  RouteMeta,
  BuildPageOption,
  RedirectManifest,
} from '@landing-page-sdk/types';
import { STUB, REDIRECT } from './regexp';
import { join, relative } from '@landing-page-sdk/utils-node';

export const manifest: RouteManifest = {
  meta: {} as RouteMeta,
  dict: {
    site: [],
    locale: [],
    route: [],
  },
  map: {},
};

export const redirectManifest: RedirectManifest = {};

export function create(pagesInfo: PagesInfo, option: BuildPageOption) {
  const { cfg, cli } = option;
  const { pages: _pages, langInfo, sites } = pagesInfo;
  const { useSiteAsPath, resolution, orientation, mode } = cfg.route;
  const { langs } = langInfo;
  manifest.meta = {
    ...cfg.route,
    keyOrder: ['site', 'fromLocale', 'toLocale', 'fromRoute', 'toRoute'],
  };
  manifest.dict.site = [...sites];
  manifest.dict.locale = [...langs];
  const pages = _pages.filter(
    // (p) => !STUB.test(p.name) || !REDIRECT.test(p.name)
    Boolean
  );
  manifest.dict.route = Array.from(new Set(pages.map((p) => p.route))).filter(Boolean) as string[];
  const useSite = useSiteAsPath || cli.mode === 'dev';

  pages.forEach((from) => {
    const { site: fromSite, lang: fromLang } = from;

    const fromRoute = from.route!;
    const isRedirect = REDIRECT.test(from.name);
    const isStub = STUB.test(from.name);

    let fromDir = join(from.rootFilename, '../');

    if (useSite && fromSite) {
      fromDir = join('/', fromSite, fromDir);
    }

    pages.forEach((to) => {
      const { site: toSite, lang: toLang } = to;

      const toRoute = to.route;
      const diffSite = fromSite !== toSite;
      const fromRedirectToDeep = isRedirect && toRoute && toRoute !== '/';
      const fromStubToDiff = isStub && from.stubFor !== toRoute;

      if (!toRoute || diffSite || fromRedirectToDeep || fromStubToDiff) {
        return;
      }

      let href = to.rootFilename;

      if (useSite && toSite) {
        href = join('/', toSite, href);
      }

      if (resolution === 'rel') {
        href = relative(fromDir, href);
      }

      if (mode === 'tree' && orientation === 'dir') {
        href = join(href, '../');
      }

      if (isRedirect || isStub) {
        if (toLang) {
          if (!redirectManifest[fromDir]) {
            redirectManifest[fromDir] = {};
          }

          const destGroup = redirectManifest[fromDir] as Record<string, string>;
          destGroup[toLang] = href;
        } else {
          redirectManifest[fromDir] = href;
        }

        return;
      }

      const routeMapKey = [
        manifest.dict.site.indexOf(toSite!),
        manifest.dict.locale.indexOf(fromLang!),
        manifest.dict.locale.indexOf(toLang!),
        manifest.dict.route.indexOf(fromRoute),
        manifest.dict.route.indexOf(toRoute),
      ].join() as RouteMapKey;

      manifest.map[routeMapKey] = href;
    });
  });
}
