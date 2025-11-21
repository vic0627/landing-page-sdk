import { SDKPlugin } from '@landing-page-sdk/types';
import { namedLogger } from '../common';

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
    transform(code, id) {
      if (
        ![
          // entry from client
          'main.js',
          'main.ts',
          // entry from core
          'redirect/flat.ts',
          'redirect/tree.ts',
          'redirect/stub.ts',
        ].some((name) => id.includes(name))
      ) {
        return;
      }

      id = id.replace(process.cwd(), '');
      const page = pages.find((p) => p.entry === id || p.entry?.includes(id));

      if (page) {
        const context = JSON.stringify(page.getContext());
        return `globalThis['${PAGE_CTX}']=Object.freeze(${context});Object.freeze(${PAGE_CTX}.data)\n${code}`;
      }

      return;
    },
  };
}) as SDKPlugin;
