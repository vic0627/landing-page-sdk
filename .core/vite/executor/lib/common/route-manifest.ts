import {
  PagesInfo,
  RouteManifest,
  RouteOption,
  RouteMapKey,
  RouteMeta,
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

export function create(pagesInfo: PagesInfo, options: Required<RouteOption>) {
  const { pages: _pages, langInfo, sites } = pagesInfo;
  const { useSiteAsPath, resolution, orientation, mode } = options;
  const { langs } = langInfo;
  manifest.meta = {
    ...options,
    keyOrder: ['site', 'fromLocale', 'toLocale', 'fromRoute', 'toRoute'],
  };
  manifest.dict.site = [...sites];
  manifest.dict.locale = [...langs];
  const pages = _pages.filter(
    (p) => !STUB.test(p.name) || !REDIRECT.test(p.name)
  );
  manifest.dict.route = Array.from(new Set(pages.map((p) => p.route))).filter(
    Boolean
  ) as string[];
  const useSite = useSiteAsPath;

  pages.forEach((from) => {
    const { site: fromSite, lang: fromLang } = from.data ?? {};

    if (!from.route) {
      return;
    }

    const fromRoute = from.route!;

    let fromDir = join(from.rootFilename, '../');

    if (useSite && fromSite) {
      fromDir = join('/', fromSite, fromDir);
    }

    pages.forEach((to) => {
      const { site: toSite, lang: toLang } = to.data ?? {};

      if (!to.route || fromSite !== toSite) {
        return;
      }

      const toRoute = to.route!;
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
