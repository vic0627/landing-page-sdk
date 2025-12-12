import { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';
import { Connect } from 'vite';
import { isPlainObject, isString } from 'lodash-es';
import chalk from 'chalk';
import { SDKPlugin } from '@landing-page-sdk/types';
import { namedLogger, redirectManifest } from '../common';

const name = 'vite-plugin-redirect';

/**
 * @deprecated
 */
export default (({ pagesInfo, siteConfig, cliOption }) => {
  const { redirect } = siteConfig;
  const { langInfo } = pagesInfo;
  const { langs, defaultLang } = langInfo;
  const isSingleLang = langs.length < 2;

  if (!redirect.enable || isSingleLang) {
    return;
  }

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
        const lang = detectLang(langs, defaultLang, req.headers);

        if (url in redirectManifest) {
          let dest = redirectManifest[url];

          if (isPlainObject(dest)) {
            dest = (dest as Record<string, string>)[lang ?? defaultLang ?? ''];
          }

          if (isString(dest)) {
            redirectTo(res, dest, query);
            log(`Redirect from ${chalk.green(url)} to ${chalk.green(dest)}`);

            return;
          }
        }

        next();
      });
    },
  };
}) satisfies SDKPlugin;

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
): string | undefined {
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

function redirectTo(res: ServerResponse<IncomingMessage>, location: string, query?: string) {
  if (query) {
    location += '?' + query;
  }

  res.statusCode = 302;
  res.setHeader('Location', location);
  res.end();
}
