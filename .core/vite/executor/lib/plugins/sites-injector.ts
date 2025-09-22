import { getPath } from '@landing-page-sdk/utils-node';
import { SDKPlugin } from '@landing-page-sdk/types';
import { getImportStatement, namedLogger } from '../common';
import chalk from 'chalk';

const name = 'vite-plugin-sites-injector';

export default (({ pagesInfo, cliOptions }) => {
  const log = namedLogger({
    name,
    verbose: cliOptions.verbose,
  });

  return {
    name,
    transform(code, id) {
      const page = pagesInfo.pages.find((p) => p.entry && id.includes(p.entry));

      if (!page || !page.siteScript) {
        return;
      }

      const siteName = page.data['site'] ?? page.siteScript;
      log(`Injected site-specific script ${chalk.green(siteName)}`);

      const importStatement = getImportStatement(page.siteScript);

      return (code += importStatement);
    },
  };
}) satisfies SDKPlugin;
