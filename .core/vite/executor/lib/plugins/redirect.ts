import { Page, SDKPlugin } from '@landing-page-sdk/types';
import { isBoolean, isObject } from 'lodash-es';
import { Connect } from 'vite';
import {
  IncomingHttpHeaders,
  IncomingMessage,
  ServerResponse,
} from 'node:http';
import { join } from 'node:path';
import { namedLogger } from '../common';
import chalk from 'chalk';

const name = 'vite-plugin-redirect';

export default (({ pagesInfo, siteConfig, cliOption }) => {
  const { redirect } = siteConfig;
  const { pages, langInfo } = pagesInfo;
  const { langs } = langInfo;

  const disabledByRoot = isBoolean(redirect) && redirect !== false;
  const disabledByInner = isObject(redirect) && redirect.enable !== false;
  const isSingleLang = langs.length < 2;

  if (disabledByRoot || disabledByInner || isSingleLang) {
    return;
  }

  const routeMap = getRouteMap(pages);
  const pageData = pages[0].data;
  const defaultLang = pageData?.env?.['defaultLang'] as string | undefined;
  const getUserLang = (headers?: IncomingHttpHeaders) =>
    detectLang(langs, defaultLang, headers);

  const log = namedLogger({
    name,
    verbose: cliOption.verbose,
  });

  return {
    name,
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (routeGuard(req, res, next)) {
          return;
        }

        const [url, query] = req?.url!.split('?');
        const lang = getUserLang(req.headers);
        const matchRoute = routeMap.get(url);
        const dest = matchRoute?.(lang);

        if (redirectTo(res, dest, query)) {
          log(`Redirect from ${chalk.green(url)} to ${chalk.green(dest)}`);
          return;
        }

        next();
      });
    },
  };
}) satisfies SDKPlugin;

function getRouteMap(pages: Page[]) {
  const map = new Map<string, (lang?: string) => string | undefined>();
  pages.forEach(({ data, route }) => {
    const { site, alias } = data ?? {};
    const sitePrefix = '/' + (alias || site || '');
    const pos1 = join(sitePrefix, route!);
    const pos2 = join(sitePrefix, route!, '/');

    if (map.has(pos1) || map.has(pos2)) {
      return;
    }

    const dest = (lang?: string) => lang && join(sitePrefix, lang, route!, '/');
    map.set(pos1, dest);
    map.set(pos2, dest);
  });
  return map;
}

function routeGuard(
  req: Connect.IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  next: Connect.NextFunction
) {
  const wrongMethod = req.method !== 'GET';
  const assets = req.url?.includes('.');
  const virtual = req.url?.startsWith('/@');

  if (wrongMethod || assets || virtual) {
    next();
    return true;
  }

  return false;
}

function detectLang(
  supported: string[],
  defaultLang?: string,
  headers?: IncomingHttpHeaders
) {
  if (!headers) {
    return defaultLang;
  }

  const { 'accept-language': acceptLang = '' } = headers;
  const first = acceptLang.split(',')[0]?.trim();
  const found = supported.find(
    (lang) => lang === first || lang.startsWith(first) || first.startsWith(lang)
  );
  return found ?? defaultLang ?? supported[0];
}

function redirectTo(
  res: ServerResponse<IncomingMessage>,
  location?: string,
  query?: string
) {
  if (!location) {
    return false;
  }

  if (query) {
    location += '?' + query;
  }

  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
  return true;
}
