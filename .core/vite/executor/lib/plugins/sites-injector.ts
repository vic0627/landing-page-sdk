import { SDKPlugin } from '@landing-page-sdk/types';
import { getImportStatement } from '../common';

export default (({ pagesInfo, siteOptions }) => {
  const append = siteOptions.append?.siteScript ?? 'pre';

  return {
    name: 'vite-plugin-sites-injector',
    transform(code, id) {
      const page = pagesInfo.pages.find((p) => p.entry && id.includes(p.entry));

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
}) satisfies SDKPlugin;
