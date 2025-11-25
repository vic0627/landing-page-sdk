import { sep, dirname } from 'node:path';
import * as fs from 'node:fs/promises';
import chalk from 'chalk';
import { SiteContext } from '@landing-page-sdk/types';
import { isMediaAsset, join } from '@landing-page-sdk/utils-node';
import { namedLogger } from '../common';

const log = namedLogger({
  name: 'public-porter',
  verbose: true,
});

/** 走訪 publicDir，逐檔搬運到一個目的根目錄 */
async function copyPublicIntoRoot(
  publicDir: string,
  destRoot: string,
  thresholdBytes?: number
): Promise<void> {
  // 確保目標根目錄存在
  await fs.mkdir(destRoot, { recursive: true });

  // DFS 走訪 publicDir
  async function walkAndCopy(srcDir: string, relDir = ''): Promise<void> {
    const dirFull = join(srcDir, relDir);
    const entries = await fs.readdir(dirFull, { withFileTypes: true });

    for (const ent of entries) {
      const rel = join(relDir, ent.name);
      const src = join(srcDir, rel);
      const dest = join(destRoot, rel);

      if (ent.isDirectory()) {
        await fs.mkdir(dest, { recursive: true });
        await walkAndCopy(srcDir, rel);

        continue;
      }

      if (ent.isFile()) {
        // 檢查大小（僅針對多媒體）
        if (isMediaAsset(src)) {
          const st = await fs.stat(src); // Node fs.stat 可取得 size (bytes)

          if (
            typeof thresholdBytes === 'number' &&
            thresholdBytes !== 0 &&
            st.size > thresholdBytes
          ) {
            const ceil = Math.round(thresholdBytes / 1024);
            const kb = (st.size / 1024).toFixed(1);
            const relUnix = rel.split(sep).join('/'); // 日誌用一致分隔符
            log(
              `Large media asset: ${chalk.redBright(relUnix)} — ${chalk.redBright(
                kb
              )} KB (> ${ceil} KB)`
            );
          }
        }

        // 確保目的目錄存在後複製
        await fs.mkdir(dirname(dest), { recursive: true });
        await fs.copyFile(src, dest); // 標準檔案複製 API
      }

      // 其他型態（symbolic link 等）依需求擴充
    }
  }

  await walkAndCopy(publicDir, '');
}

/**
 * 主要入口：把 publicDir 搬到 outDir（單站）或 outDir/<site>（多站）
 */
export default async function (ctx: SiteContext, outDir: string): Promise<void> {
  const publicDir = ctx.siteConfig.sourcePath.public;

  // 若 publicDir 不存在，視為無事可做
  try {
    const st = await fs.stat(publicDir);
    if (!st.isDirectory()) {
      // 存在但不是資料夾，不處理
      return;
    }
  } catch {
    return;
  }

  const sites = ctx.pagesInfo.sites;
  // 決定目的根目錄們
  const siteRoots = sites.length === 0 ? [outDir] : sites.map((site) => join(outDir, site));

  for (const root of siteRoots) {
    await copyPublicIntoRoot(publicDir, root, ctx.siteConfig.output.threshold);
  }
}
