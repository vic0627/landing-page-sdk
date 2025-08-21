import { Plugin } from 'vite';
import { Page, SiteOptions } from '@landing-page-sdk/types';
import { getImportStatement } from '../common';

export default (pages: Page[], siteOptions: SiteOptions): Plugin => {
  const append = siteOptions.append?.siteScript ?? 'pre';

  return {
    name: 'vite-plugin-sites-injector',
    transform(code, id) {
      const page = pages.find((p) => p.entry && id.includes(p.entry));

      if (!page || !page.siteScript) {
        return;
      }

      const importStatement = getImportStatement(page.siteScript);

      return append === 'pre'
        ? (code = importStatement + code)
        : append === 'post'
        ? (code += importStatement)
        : null;
    },
  };
};
