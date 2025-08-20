import { workspaceRoot } from '@nx/devkit';
import child_process from 'node:child_process';
import path from 'node:path';

export function getProjectPath(projectWithFile: string): string {
  const out = child_process.execSync(`npx nx show projects --json`, {
    encoding: 'utf-8',
  });
  const projects = JSON.parse(out) as string[];
  const match = projects.find((projectName) =>
    projectWithFile.startsWith(projectName)
  );

  if (!match) {
    throw new Error(`Cannot resolve project for path: ${projectWithFile}`);
  }

  const relFile = projectWithFile.replace(match, '');
  const { root } = JSON.parse(
    child_process.execSync(`nx show project ${match} --json`, {
      encoding: 'utf-8',
    })
  );
  const fullPath = path.join(workspaceRoot, root, relFile);

  return fullPath;
}
