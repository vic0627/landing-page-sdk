import { workspaceRoot } from '@nx/devkit';
import * as child_process from 'child_process';
import * as path from 'path';

function getProjectPath(projectWithFile: string): string {
  const out = child_process.execSync(`nx show project --all --json`, {
    encoding: 'utf-8',
  });
  const projects = JSON.parse(out); // 預期是一個物件，key 是 projectName
  // 找出最長的 projectName 作為前綴
  const projectNames = Object.keys(projects);
  const match = projectNames
    .filter(
      (name) =>
        projectWithFile === name || projectWithFile.startsWith(name + '/')
    )
    .sort((a, b) => b.length - a.length)[0];
  if (!match) {
    throw new Error(`Cannot resolve project for path: ${projectWithFile}`);
  }
  const relFile = projectWithFile.slice(match.length + 1);
  const { root } = JSON.parse(
    child_process.execSync(`nx show project ${match} --json`, {
      encoding: 'utf-8',
    })
  );
  return path.join(workspaceRoot, root, relFile);
}
