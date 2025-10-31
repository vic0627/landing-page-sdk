import { JSDOM, DOMWindow } from 'jsdom';
import chalk from 'chalk';
import { Page, SDKPlugin } from '@landing-page-sdk/types';
import { manifestResolver } from '@landing-page-sdk/utils-node';
import { Logger, namedLogger, manifest } from '../common';

const name = 'vite-plugin-router-link';
const LINK_ATTRS = {
  TO: 'data-to',
  LOCALE: 'data-locale',
  QUERY: 'data-query',
};

let log!: Logger;

export default (({ siteConfig, cliOption, pagesInfo }) => {
  const { pages } = pagesInfo;

  log = namedLogger({
    name,
    verbose: cliOption.verbose,
  });

  return {
    name,
    enforce: 'pre',
    transformIndexHtml(html, { path }) {
      const page = pages.find((p) => p.filename === path.slice(1));
      const jsdom = new JSDOM(html);
      const { window } = jsdom;
      const links = getLinks(window, path, pages, page);

      if (!page || !links.size) {
        return;
      }

      const { route: fromRoute } = page;
      const { lang: fromLocale, site: fromSite } = page.data ?? {};

      links.forEach((dest, e) => {
        const { route: toRoute } = dest;
        const { site: toSite, lang: toLocale } = dest.data ?? {};

        if (!fromRoute || !toRoute || fromSite !== toSite) {
          return;
        }

        try {
          const href = manifestResolver(manifest, {
            site: fromSite,
            fromRoute,
            fromLocale,
            toRoute,
            toLocale,
          });
          e.setAttribute('href', href);
        } catch (error) {
          console.error(error);
        }
      });

      return jsdom.serialize();
    },
  };
}) satisfies SDKPlugin;

function getLinks(
  window: DOMWindow,
  path: string,
  pages: Page[],
  page?: Page
): Map<Element, Page> {
  const map = new Map<Element, Page>();
  const lang = page?.data?.lang;
  const site = page?.data?.site;

  window.document.querySelectorAll(`a[${LINK_ATTRS.TO}]`).forEach((link) => {
    const to = link.getAttribute(LINK_ATTRS.TO);
    const validFormat = !!to && to.startsWith('/');

    if (!validFormat) {
      log(
        `invalid route format ${chalk.redBright(to)} from ${chalk.green(path)}`
      );
      return;
    }

    const locale = link.getAttribute(LINK_ATTRS.LOCALE) ?? lang;
    const destPage = pages.find(
      (p) => p.route === to && p.data?.lang === locale && p.data?.site === site
    );

    if (!destPage) {
      log(
        `unidentified route destination ${chalk.redBright(
          to
        )} from ${chalk.green(path)}`
      );
      return;
    }

    link.removeAttribute(LINK_ATTRS.TO);
    link.removeAttribute(LINK_ATTRS.LOCALE);

    map.set(link, destPage);
  });

  return map;
}
