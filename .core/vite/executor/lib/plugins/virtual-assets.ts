import { SDKPlugin } from '@landing-page-sdk/types';
import { namedLogger, manifest } from '../common';

const name = 'vite-plugin-virtual-assets';

export default (({ pagesInfo, siteConfig, cliOption }) => {
  const log = namedLogger({
    name,
    verbose: cliOption.verbose,
  });

  return {
    name,
    resolveId(id) {
      if (id === 'virtual:route-manifest') {
        return '\0' + id;
      }

      return;
    },
    load(id) {
      if (id === '\0virtual:route-manifest') {
        return `export default ${JSON.stringify(manifest)}`;
      }

      return;
    },
  };
}) as SDKPlugin;
