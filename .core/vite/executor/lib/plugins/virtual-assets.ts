import { SDKPlugin } from '@landing-page-sdk/types';
import { namedLogger, manifest, findExist } from '../common';
import { readFile } from 'node:fs/promises';
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
        const entry = await findExist([
          resolve(pagesDir, 'main.js'),
          resolve(pagesDir, 'main.ts'),
          resolve(pagesDir, 'main.jsx'),
          resolve(pagesDir, 'main.tsx'),
        ]);

        if (!entry) {
          throw new Error(
            'root entry file must exist while using virtual entry'
          );
        }

        log('virtual entry:', id);
        return (await readFile(entry)).toString('utf-8');
      }

      return;
    },
  };
}) as SDKPlugin;
