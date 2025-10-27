import { JSDOM } from 'jsdom';
import { SDKPlugin } from '@landing-page-sdk/types';
import { REDIRECT, STUB } from '../common';
import { isObject } from 'lodash-es';

export default (({ pagesInfo, siteConfig }) => {
  const { redirect } = siteConfig;

  if (!isObject(redirect) || redirect.enable === false || !redirect.transform) {
    return;
  }

  const redirectPages = pagesInfo.pages.filter(
    (page) => REDIRECT.test(page.name) || STUB.test(page.name)
  );
  const findRedirectPage = (path: string) =>
    redirectPages.find((page) => page.filename === path.replace('/', ''));

  return {
    name: 'vite-plugin-transform-redirect',
    async transformIndexHtml(code, { path }) {
      const page = findRedirectPage(path);

      if (!page) {
        return;
      }

      const vm = new JSDOM(code);

      await redirect.transform!.apply(vm.window, [page]);

      return vm.serialize();
    },
  };
}) satisfies SDKPlugin;
