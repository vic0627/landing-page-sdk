import { SDKPlugin } from '@landing-page-sdk/types';
import { getImportStatement } from '../common';

export default (({ pagesInfo, siteOptions }) => {

  return {
    name: 'vite-plugin-sites-injector',
    transform(code, id) {
      const page = pagesInfo.pages.find((p) => p.entry && id.includes(p.entry));

      if (!page || !page.siteScript) {
        return;
      }

      const importStatement = getImportStatement(page.siteScript);

      return code += importStatement
    },
  };
}) satisfies SDKPlugin;
