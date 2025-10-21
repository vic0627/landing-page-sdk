import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { TemplateGeneratorSchema } from '@landing-page-sdk/types';
import { join } from '@landing-page-sdk/utils-node';

const BASE = 'sites';

export async function templateGenerator(
  tree: Tree,
  options: TemplateGeneratorSchema
) {
  let projectRoot = join(BASE, options.path);

  if (projectRoot.endsWith('/')) {
    projectRoot = projectRoot.slice(0, -1);
  }

  const source = join(__dirname, 'files');
  const depthRel = projectRoot
    .split('/')
    .map(() => '../')
    .join('');

  generateFiles(tree, source, projectRoot, { ...options, depthRel });
  await formatFiles(tree);
}

export default templateGenerator;
