import { readFileSync, writeFileSync, statSync } from 'node:fs';
import fsp from 'node:fs/promises';
import { parse } from 'node:path';
import { resolveProj, join } from './path';

export async function isDir(path: string) {
  try {
    return (await fsp.stat(path)).isDirectory();
  } catch {
    return false;
  }
}

export function isDirSync(path: string) {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

export function isHiddenFile(filePath: string) {
  const filename = parse(filePath).name;
  return filename.startsWith('.');
}

export function ensureDir(dir: string) {
  return fsp.mkdir(dir, { recursive: true });
}

type ScanOptions = {
  /**
   * 匹配的目錄或檔案
   */
  match?: RegExp;
  /**
   * 遞迴掃描
   * @default false
   */
  recursive?: boolean;
};

/**
 * 非同步掃描目標目錄，返回檔案或目錄的路徑
 */
export async function scanDir(dir: string, options?: ScanOptions): Promise<string[]> {
  try {
    const { recursive = false } = options || {};
    // 避免 g-flag 造成 .test() 受 lastIndex 影響
    const match = options?.match
      ? new RegExp(options.match.source, options.match.flags.replace('g', ''))
      : undefined;

    const items = await fsp.readdir(dir, { withFileTypes: true });

    const promises = items.map(async (ent) => {
      const full = join(dir, ent.name);
      const results: string[] = [];

      if (ent.isDirectory()) {
        // **重點：無論目錄名是否匹配，都先遞迴**
        if (recursive) {
          results.push(...(await scanDir(full, options)));
        }

        // 是否把這個「目錄本身」放進結果，再看 match
        if (!match || match.test(ent.name)) {
          results.push(full);
        }
      } else if (!match || match.test(ent.name)) {
        results.push(full);
      }
      return results;
    });

    return (await Promise.all(promises)).flat();
  } catch (error) {
    // 當目錄不存在或無權限時，readdir 會拋出錯誤，此時回傳空陣列，行為與同步版本一致
    return [];
  }
}

type StringOptions = {
  /** @default 'utf-8' */
  encoding?: BufferEncoding;
  start?: number;
  end?: number;
};

export function readFileAsString(filePath: string, options?: StringOptions): string {
  try {
    filePath = resolveProj(filePath);
  } catch {}

  const { encoding = 'utf-8', start, end } = options ?? {};

  return readFileSync(filePath).toString(encoding, start, end);
}

export function writeJsonFile(filePath: string, content: object) {
  const jsonString = JSON.stringify(content);

  try {
    filePath = resolveProj(filePath);
  } catch {}

  writeFileSync(filePath, jsonString);
}
