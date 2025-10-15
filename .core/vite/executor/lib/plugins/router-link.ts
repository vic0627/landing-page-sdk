import { JSDOM, DOMWindow } from 'jsdom';
import { Page, SDKPlugin } from '@landing-page-sdk/types';
import { relative, join } from '@landing-page-sdk/utils-node';
import { Logger, namedLogger } from '../common';
import chalk from 'chalk';

const name = 'vite-plugin-router-link';
const LINK_ATTRS = {
  TO: 'data-to',
  LOCALE: 'data-locale',
  QUERY: 'data-query',
};

let log!: Logger;

export default (({ siteConfig, cliOption, pagesInfo }) => {
  const { pages } = pagesInfo;
  const { route } = siteConfig;
  const { mode: viteMode } = cliOption;

  const treeRoute = route.mode === 'tree';
  const relResolution = route.resolution === 'rel';
  const dirOrientation = route.orientation === 'dir';

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

      const from = join(page.rootFilename, '../');

      links.forEach((dest, e) => {
        const { alias, site } = dest.data ?? {};
        const to = dest.rootFilename;

        let href!: string;

        if (relResolution) {
          href = normalizeRelPath(
            treeRoute ? relative(from, to) : join('./', to)
          );
        } else {
          const segment = viteMode === 'dev' ? alias ?? site : alias;
          href = segment ? join('/', segment, to) : to;
        }

        if (treeRoute && dirOrientation) {
          href = normalizeRelPath(join(href, '../'));
        }

        e.setAttribute('href', href);
      });

      return jsdom.serialize();
    },
  };
}) satisfies SDKPlugin;

function normalizeRelPath(path: string) {
  if (path.startsWith('.') || path.startsWith('/')) {
    return path;
  }

  return './' + path;
}

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
