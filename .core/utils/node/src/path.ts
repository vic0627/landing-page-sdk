import {
  relative as _relative,
  resolve as _resolve,
  join as _join,
  dirname as _dirname,
  basename as _basename,
} from 'node:path';
import { normalizePath } from 'vite';
import { workspaceRoot, readCachedProjectGraph } from '@nx/devkit';

export function resolve(...paths: string[]) {
  return normalizePath(_resolve(...paths));
}

export function join(...paths: string[]) {
  return normalizePath(_join(...paths));
}

export function relative(from: string, to: string) {
  return normalizePath(_relative(from, to));
}

export function dirname(path: string) {
  return normalizePath(_dirname(path));
}

export function basename(path: string, suffix?: string) {
  return normalizePath(_basename(path, suffix));
}

export function getPath(...paths: string[]) {
  return resolve(process.cwd(), ...paths);
}

export function getPathFromRoot(...paths: string[]) {
  return resolve(workspaceRoot, ...paths);
}

export function getRelPathFromRoot(...paths: string[]) {
  return relative(getPath(), getPathFromRoot(...paths));
}

export function getProjectPath(projPath: string): string {
  const slashIdx = projPath.indexOf(
    '/',
    projPath.startsWith('@') ? projPath.indexOf('/') + 1 : undefined
  );
  const name = projPath.slice(0, slashIdx);
  const sub = projPath.slice(slashIdx + 1);

  if (!name) {
    throw new Error(`failed to parse project path ${projPath}`);
  }

  const graph = readCachedProjectGraph();
  const node = graph.nodes[name];

  if (!node) {
    throw new Error(`cannot find project ${projPath}`);
  }

  return join(workspaceRoot, node.data.root, sub);
}
