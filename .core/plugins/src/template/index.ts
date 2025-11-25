import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  readJson,
  Tree,
  writeJson,
  offsetFromRoot,
  getProjects,
} from '@nx/devkit';
import { TemplateGeneratorSchema } from '@landing-page-sdk/types';
import { join } from '@landing-page-sdk/utils-node';

export async function templateGenerator(tree: Tree, options: TemplateGeneratorSchema) {
  const projectRoot = options.path.endsWith('/') ? options.path.slice(0, -1) : options.path;
  const source = join(__dirname, 'files');
  const ext = options.useTs ? 'ts' : 'js';
  const depthRel = offsetFromRoot(projectRoot);
  const rootPkg = readJson(tree, 'package.json');

  if (getProjects(tree).has(options.name)) {
    throw new Error(`${options.name} already exists`);
  }

  if (rootPkg.workspaces.includes(projectRoot)) {
    throw new Error(`${projectRoot} already exists as a workspace`);
  }

  const forbiddenPaths = ['node_modules', 'dist', '.core', '.nx', 'docs'];
  const isInvalidPath = forbiddenPaths.some((path) => projectRoot.startsWith(path));

  if (isInvalidPath) {
    throw new Error(`Invalid path: ${projectRoot}`);
  }

  generateFiles(tree, source, projectRoot, { ...options, depthRel, ext });

  const deleteFiles: string[] = [];
  const dependencies: Record<string, string> = {};
  const vueExcludes: string[] = [
    `src/pages/app.${ext}x`,
    `src/pages/main.${ext}x`,
    `src/components/router-link.${ext}x`,
    `src/components/counter.${ext}x`,
    `src/components/react-logo.${ext}x`,
    `src/components/vite-logo.${ext}x`,
    'public/__ASSETS__/react.svg',
  ];
  const reactExcludes: string[] = [
    'src/pages/app.vue',
    `src/pages/main.${ext}`,
    'src/components/router-link.vue',
    'src/components/counter.vue',
    'src/components/vue-logo.vue',
    'src/components/vite-logo.vue',
    'public/__ASSETS__/vue.svg',
  ];

  // add framework dependencies
  if (options.framework === 'none') {
    deleteFiles.push(`src/composables/use-i18n.${ext}`, ...vueExcludes, ...reactExcludes);
  } else {
    deleteFiles.push(`src/composables/counter.${ext}`);

    if (options.framework === 'vue') {
      deleteFiles.push(...vueExcludes);
      dependencies['vue'] = '^3.5.22';
      dependencies['@vitejs/plugin-vue'] = '^6.0.1';
    } else if (options.framework === 'react') {
      deleteFiles.push(...reactExcludes);
      dependencies['react'] = '^19.2.0';
      dependencies['react-dom'] = '^19.2.0';
      dependencies['@vitejs/plugin-react'] = '^5.1.1';
    }
  }

  // add style dependencies
  if (options.style.includes('tailwindcss')) {
    dependencies['tailwindcss'] = '^4.1.17';
    dependencies['@tailwindcss/vite'] = '^4.1.17';
  }

  if (options.style.includes('sass')) {
    dependencies['sass-embedded'] = '^1.93.2';
  } else {
    deleteFiles.push('src/styles/main.scss');
  }

  // delete unused files
  deleteFiles.forEach((file) => tree.delete(join(projectRoot, file)));

  // add dependencies to project
  const pkg = readJson(tree, join(projectRoot, 'package.json'));
  pkg.dependencies = {
    ...pkg.dependencies,
    ...dependencies,
  };
  writeJson(tree, join(projectRoot, 'package.json'), pkg);

  // add project to workspace
  rootPkg.workspaces.push(projectRoot);
  writeJson(tree, 'package.json', rootPkg);

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  };
}

export default templateGenerator;
