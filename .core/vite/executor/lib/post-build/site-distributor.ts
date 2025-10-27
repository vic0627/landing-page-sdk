import fsp from 'node:fs/promises';
import { readJsonFile } from '@nx/devkit';
import { Manifest } from 'vite';
import { SiteContext } from '@landing-page-sdk/types';
import { join } from '@landing-page-sdk/utils-node';
import { namedLogger } from '../common';

const MANIFEST = 'manifest.json';

export default async (ctx: SiteContext, outDir: string) => {
  const sites = ctx.pagesInfo.sites;

  const log = namedLogger({
    name: 'build-helper',
    verbose: true,
  });

  // 若沒有指定任何目的地，則無事可做，直接返回
  if (!sites.length) {
    log('no destination dirs resolved from sites. skip.');
    return;
  }

  for (const site of sites) {
    const list = await getAssetsList(outDir, site);

    for (const asset of list) {
      const source = join(outDir, asset);
      const target = join(outDir, site, asset);

      await fsp.cp(source, target, { recursive: true });
    }
  }

  await fsp.rm(join(outDir, '__ASSETS__'), { recursive: true, force: true });
  await fsp.rm(join(outDir, '.vite'), { recursive: true, force: true });
};

async function getAssetsList(
  outDir: string,
  site: string
): Promise<Set<string>> {
  const manifest = readJsonFile<Manifest>(join(outDir, '.vite', MANIFEST));
  const list: Set<string> = new Set();

  const traverseManifest = (key: string) => {
    const chunk = manifest[key];

    if (!chunk) {
      return;
    }

    list.add(chunk.file);

    if (chunk.css) {
      for (const css of chunk.css) {
        list.add(css);
      }
    }

    if (chunk.imports) {
      for (const script of chunk.imports) {
        traverseManifest(script);
      }
    }
  };

  for (const path in manifest) {
    if (!path.startsWith(`${site}/`) || !path.endsWith('.html')) {
      continue;
    }

    traverseManifest(path);
  }

  return list;
}
