import { relative, join } from 'node:path';
import { JSDOM, DOMWindow } from 'jsdom';
import { Page, SDKPlugin } from '@landing-page-sdk/types';
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
  const isRel = siteConfig.output.assets === 'rel';

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

      if (siteConfig.route.mode === 'tree') {
        transformByTree.apply(window, [page, links, isRel]);
      } else {
        transformByFlat.apply(window, [page, links, isRel]);
      }

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
      (p) => p.route === to && p.data?.lang === locale
    );

    if (!destPage) {
      log(
        `unidentified route destination ${chalk.redBright(
          to
        )} from ${chalk.green(path)}`
      );
      return;
    }

    map.set(link, destPage);
  });

  return map;
}

function transformByTree(
  this: DOMWindow,
  page: Page,
  links: Map<Element, Page>,
  isRel: boolean
) {
  const from = join('/', page.filename);

  links.forEach((dest, e) => {
    const to = join('/', dest.filename);

    if (isRel) {
      const href = relative(from, to);
      e.setAttribute('href', href);
    } else {
      // e.setAttribute('href')
    }
  });
}

function transformByFlat(
  this: DOMWindow,
  page: Page,
  links: Map<Element, Page>,
  isRel: boolean
) {}

// function a() {
//   const entryIdx = path.indexOf(`/index.html`);
//   path = path.slice(0, entryIdx);
//   path ||= '/';

//   $routerLink.forEach((link) => {
//     // redirect url
//     const to = link.getAttribute(LINK_ATTRS.TO);
//     const locale = link.getAttribute(LINK_ATTRS.LOCALE);
//     const { overlayPath } = findPageInfo(path, to, locale);

//     if (overlayPath) {
//       let dest = relative(path, overlayPath);
//       if (server) dest = join(dest, dest ? `/index.html` : '');
//       else dest += '/';
//       link.setAttribute('href', dest);
//     }

//     const query = link.getAttribute(LINK_ATTRS.QUERY);
//     if (query === null) link.setAttribute(LINK_ATTRS.QUERY, '');

//     link.removeAttribute(LINK_ATTRS.TO);
//     link.removeAttribute(LINK_ATTRS.TO);
//   });
// }
