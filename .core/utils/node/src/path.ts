import { resolve } from 'node:path';
import { workspaceRoot } from '@nx/devkit';

export function getPath(...paths: string[]) {
  return resolve(process.cwd(), ...paths);
}

export function getPathFromRoot(...paths: string[]) {
  return resolve(workspaceRoot, ...paths);
}
