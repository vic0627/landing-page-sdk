// copy-public.ts
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

type Options = {
  outDir: string;
  sites: string[];
  publicDir?: string; // default: 'public'
  thresholdBytes?: number; // default: 256 * 1024 (256 KB)
};

const DEFAULT_PUBLIC = 'public';

// 依你的需求調整：常見「多媒體資產」副檔名（大小寫不敏感）
const MEDIA_EXTS = new Set([
  // image
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.svg',
  // video
  '.mp4',
  '.webm',
  '.ogg',
  '.ogv',
  '.mov',
  '.m4v',
  // audio
  '.mp3',
  '.wav',
  '.aac',
  '.m4a',
  '.oga',
  '.flac',
  // fonts（若你也想納入字型）
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
]);

/** 判斷是否為多媒體資產 */
function isMediaAsset(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return MEDIA_EXTS.has(ext);
}

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
    const dirFull = path.join(srcDir, relDir);
    const entries = await fs.readdir(dirFull, { withFileTypes: true });

    for (const ent of entries) {
      const rel = path.join(relDir, ent.name);
      const src = path.join(srcDir, rel);
      const dest = path.join(destRoot, rel);

      if (ent.isDirectory()) {
        await fs.mkdir(dest, { recursive: true });
        await walkAndCopy(srcDir, rel);

        continue;
      }

      if (ent.isFile()) {
        // 檢查大小（僅針對多媒體）
        if (isMediaAsset(src)) {
          const st = await fs.stat(src); // Node fs.stat 可取得 size (bytes)

          if (typeof thresholdBytes === 'number' && st.size > thresholdBytes) {
            const kb = (st.size / 1024).toFixed(1);
            const relUnix = rel.split(path.sep).join('/'); // 日誌用一致分隔符
            console.warn(
              `[public] Large media asset: ${relUnix} — ${kb} KB (> ${Math.round(
                thresholdBytes / 1024
              )} KB)`
            );
          }
        }

        // 確保目的目錄存在後複製
        await fs.mkdir(path.dirname(dest), { recursive: true });
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
export default async function (opts: Options): Promise<void> {
  const publicDir = opts.publicDir ?? DEFAULT_PUBLIC;

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

  // 決定目的根目錄們
  const siteRoots =
    opts.sites.length === 0
      ? [opts.outDir]
      : opts.sites.map((site) => path.join(opts.outDir, site));

  for (const root of siteRoots) {
    await copyPublicIntoRoot(publicDir, root, opts.thresholdBytes);
  }
}
