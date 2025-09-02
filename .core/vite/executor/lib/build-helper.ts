import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { scanDir } from './common';

type DistInfo = {
  path: string;
  isDest: boolean;
  isDir: boolean;
  isFile: boolean;
};

export default async (outDir: string, sites: string[]) => {
  // 若沒有指定任何目的地，則無事可做，直接返回
  if (sites.length === 0) {
    console.warn(
      '[copy & clean] no destination dirs resolved from "sites". skip.'
    );
    return;
  }

  const dist = scanDir(outDir);
  const distInfo: DistInfo[] = dist.map((d) => {
    const stat = fs.statSync(d);
    const isDir = stat.isDirectory();
    const isDest = sites.length
      ? isDir
        ? sites.includes(path.parse(d).name) // 以目錄名是否在 sites 列表內判定「目的地」
        : false
      : false;

    return {
      path: d,
      isDest,
      isDir,
      isFile: stat.isFile(),
    };
  });

  // 目的地目錄清單
  const destDirs = distInfo
    .filter((x) => x.isDest && x.isDir)
    .map((x) => x.path);

  // 需要被複製且之後要刪除的來源（所有非 isDest）
  const sources = distInfo.filter((x) => !x.isDest);

  // 1) 複製：所有非 isDest 的「檔案或目錄」 -> 到每一個 isDest 目錄下
  //    複製到的目標名稱採用來源的 basename（避免整路徑被嵌套進去）
  for (const src of sources) {
    const base = path.basename(src.path);

    await Promise.all(
      destDirs.map(async (destDir) => {
        const target = path.join(destDir, base);

        // 安全檢查：避免把目的地自身或其祖先/子孫複製到自身造成遞迴地獄
        // - 來源若是某個目的地目錄，就不應在 sources 內（已被 !isDest 過濾）
        // - 另外再保護：若 target 與 src 相同或 target 落在 src 內/外彼此嵌套，則跳過
        const relA = path.relative(src.path, target);
        const relB = path.relative(target, src.path);
        if (!relA || !relB || !relA || relA === '' || relB === '') return;

        if (src.isDir) {
          await fsp.cp(src.path, target, { recursive: true }); // v16.7.0+ 可遞迴複製整包資料夾
        } else {
          await fsp.mkdir(path.dirname(target), { recursive: true });
          await fsp.copyFile(src.path, target);
        }
      })
    );
  }

  // 2) 刪除：所有非 isDest 的「檔案或目錄」
  //    使用 rm(..., { recursive: true, force: true }) 以處理非空資料夾並忽略不存在錯誤
  await Promise.all(
    sources.map((src) => fsp.rm(src.path, { recursive: true, force: true }))
  );
};
