import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { parse } from 'node:path';
import { getProjectPath, join } from './path';

export function isHiddenFile(filePath: string) {
  const filename = parse(filePath).name;
  return filename.startsWith('.');
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
 * 掃描目標目錄，返回檔案或目錄的路徑
 */
export function scanDir(dir: string, options?: ScanOptions): string[] {
  if (!existsSync(dir)) {
    return [];
  }

  const { recursive = false } = options || {};
  // 避免 g-flag 造成 .test() 受 lastIndex 影響
  const match = options?.match
    ? new RegExp(options.match.source, options.match.flags.replace('g', ''))
    : undefined;

  const out: string[] = [];
  const items = readdirSync(dir, { withFileTypes: true }); // Dirent, 無需再 statSync

  for (const ent of items) {
    const full = join(dir, ent.name);

    if (ent.isDirectory()) {
      // **重點：無論目錄名是否匹配，都先遞迴**
      if (recursive) {
        out.push(...scanDir(full, options));
      }

      // 是否把這個「目錄本身」放進結果，再看 match
      if (!match || match.test(ent.name)) {
        out.push(full);
      }
    } else if (!match || match.test(ent.name)) {
      out.push(full);
    }
  }

  return out;
}

type StringOptions = {
  /** @default 'utf-8' */
  encoding?: BufferEncoding;
  start?: number;
  end?: number;
};

export function readFileAsString(
  filePath: string,
  options?: StringOptions
): string {
  try {
    filePath = getProjectPath(filePath);
  } catch {}

  const { encoding = 'utf-8', start, end } = options ?? {};

  return readFileSync(filePath).toString(encoding, start, end);
}

export function writeJsonFile(filePath: string, content: object) {
  const jsonString = JSON.stringify(content);

  try {
    filePath = getProjectPath(filePath);
  } catch {}

  writeFileSync(filePath, jsonString);
}
