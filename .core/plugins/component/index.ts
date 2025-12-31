import {
  formatFiles,
  generateFiles,
  readProjectConfiguration,
  toJS,
  Tree,
  names,
} from '@nx/devkit';
import { merge, omit } from 'lodash-es';
import { ComponentGeneratorSchema } from '@landing-page-sdk/types';
import { join, resolveProj } from '@landing-page-sdk/utils-node';
import { readRaw, normalize, getConfigFile } from '@landing-page-sdk/vite/config';

export async function componentGenerator(tree: Tree, options: ComponentGeneratorSchema) {
  const resolvedOptions = await resolveOptions(tree, options);
  const componentNames = names(resolvedOptions.name);

  generateFiles(
    tree,
    join(__dirname, 'files', resolvedOptions.framework),
    resolvedOptions.targetDir,
    { ...resolvedOptions, componentNames }
  );

  if (!resolvedOptions.useTs) {
    toJS(tree, {
      useJsx: true,
    });
  }

  await formatFiles(tree);
}

interface ResolvedOptions extends Omit<ComponentGeneratorSchema, 'project' | 'path'> {
  targetDir: string;
}

async function resolveOptions(tree: Tree, options: ComponentGeneratorSchema) {
  const { project, path } = options;
  const resolvedOptions: ResolvedOptions = merge(omit(options, 'project', 'path'), {
    targetDir: '',
  });

  if (project) {
    const config = readProjectConfiguration(tree, project);
    const isValidProject = config?.projectType === 'application';

    if (!isValidProject) {
      throw new Error(`project '${project}' is not an application project`);
    }

    const projectPath = resolveProj(project);
    const componentDir = path ? path : await getProjectComponentPath(projectPath);

    resolvedOptions.targetDir = join(config.root, componentDir);
  } else if (path) {
    resolvedOptions.targetDir = path;
  } else {
    const config = readProjectConfiguration(tree, '@landing-page-sdk/assets');
    resolvedOptions.targetDir = join(config.root, 'components');
  }

  return resolvedOptions;
}

async function getProjectComponentPath(projectPath: string) {
  const originalDir = process.cwd();
  process.chdir(projectPath);

  const configPath = await getConfigFile();
  const config = readRaw(configPath);
  const normalizedConfig = normalize(config);

  process.chdir(originalDir);

  return normalizedConfig.sourcePath.components;
}

export default componentGenerator;
