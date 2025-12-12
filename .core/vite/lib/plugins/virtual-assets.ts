import { readFile } from 'node:fs/promises';
import fg from 'fast-glob';
import { SDKPlugin } from '@landing-page-sdk/types';
import { namedLogger, manifest } from '../common';
import { resolve } from '@landing-page-sdk/utils-node';

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

      if (id.includes('virtual-entry')) {
        return id.slice(1);
      }

      return;
    },
    async load(id) {
      if (id === '\0virtual:route-manifest') {
        return `export default ${JSON.stringify(manifest)}`;
      }

      if (id.includes('virtual-entry')) {
        const pagesDir = siteConfig.sourcePath.pages;
        const entry = await fg(resolve(pagesDir, 'main.{js,ts,jsx,tsx}'))

        if (!entry.length) {
          throw new Error('root entry file must exist while using virtual entry');
        }

        log('virtual entry:', id);
        return (await readFile(entry[0])).toString('utf-8');
      }

      return;
    },
  };
}) as SDKPlugin;
