import {
  addProjectConfiguration,
  formatFiles,
  generateFiles,
  Tree,
} from '@nx/devkit';
import * as path from 'path';
import { TemplateGeneratorSchema } from '@landing-page-sdk/types';

export async function templateGenerator(
  tree: Tree,
  options: TemplateGeneratorSchema
) {
  const projectRoot = `sites/${options.name}`;

  generateFiles(tree, path.join(__dirname, 'files'), projectRoot, options);
  await formatFiles(tree);
}

export default templateGenerator;
