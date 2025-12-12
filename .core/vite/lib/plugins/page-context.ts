import { SDKPlugin } from '@landing-page-sdk/types';
import { namedLogger } from '../common';
import { resolve } from '@landing-page-sdk/utils-node';

const PAGE_CTX = '__SDK_PAGE_CTX__';
const name = 'vite-plugin-page-context';

export default (({ pagesInfo, siteConfig, cliOption }) => {
  const { pages } = pagesInfo;

  const log = namedLogger({
    name,
    verbose: cliOption.verbose,
  });

  return {
    name,
    transformIndexHtml(html, { filename }) {
      filename = filename.replace(resolve(), '').slice(1);
      const page = pages.find((p) => p.filename === filename);
      
      if (!page) {
        return
      }

      const ctx = JSON.stringify(page.getContext())

      return html.replace(/<\/body>/, `<script id="${PAGE_CTX}" type="application/json">${ctx}</script></body>`)
    },
  };
}) as SDKPlugin;
