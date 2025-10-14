import fs, { writeFileSync } from 'node:fs';
import { getProjectPath } from './path';

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

  return fs.readFileSync(filePath).toString(encoding, start, end);
}

export function writeJsonFile(filePath: string, content: object) {
  const jsonString = JSON.stringify(content);

  try {
    filePath = getProjectPath(filePath);
  } catch {}

  writeFileSync(filePath, jsonString);
}
