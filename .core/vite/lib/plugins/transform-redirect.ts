import { JSDOM } from 'jsdom';
import { SDKPlugin } from '@landing-page-sdk/types';
import { REGEXP } from '../common';

export default (({ pagesInfo, siteOptions }) => {
  const { transformRedirect } = siteOptions;

  const redirectPages = pagesInfo.pages.filter((page) =>
    REGEXP.REDIRECT.test(page.name)
  );
  const findRedirectPage = (path: string) =>
    redirectPages.find((page) => page.filename === path.replace('/', ''));

  return {
    name: 'vite-plugin-transform-redirect',
    async transformIndexHtml(code, { path }) {
      if (!transformRedirect) {
        return;
      }

      const page = findRedirectPage(path);

      if (!page) {
        return;
      }

      const vm = new JSDOM(code);

      await transformRedirect.apply(vm.window, [page]);

      return vm.serialize();
    },
  };
}) satisfies SDKPlugin;
