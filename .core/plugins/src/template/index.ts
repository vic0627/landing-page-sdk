import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  readJson,
  Tree,
  writeJson,
} from '@nx/devkit';
import { TemplateGeneratorSchema } from '@landing-page-sdk/types';
import { join } from '@landing-page-sdk/utils-node';

export async function templateGenerator(tree: Tree, options: TemplateGeneratorSchema) {
  const projectRoot = options.path.endsWith('/') ? options.path.slice(0, -1) : options.path;
  const source = join(__dirname, 'files');
  const ext = options.useTs ? 'ts' : 'js';
  const depthRel = projectRoot
    .split('/')
    .map(() => '../')
    .join('');
  const rootPkg = readJson(tree, 'package.json');

  if (rootPkg.workspaces.includes(projectRoot)) {
    throw new Error(`${projectRoot} already exists as a workspace`);
  }

  generateFiles(tree, source, projectRoot, { ...options, depthRel, ext });

  const deleteFiles: string[] = [];
  const dependencies: Record<string, string> = {};
  const vueExcludes: string[] = [
    `src/pages/app.${ext}x`,
    `src/pages/main.${ext}x`,
    `src/components/counter.${ext}x`,
    `src/components/react-logo.${ext}x`,
    `src/components/vite-logo.${ext}x`,
    'public/__ASSETS__/react.svg',
  ];
  const reactExcludes: string[] = [
    'src/pages/app.vue',
    `src/pages/main.${ext}`,
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
      dependencies['vue'] = 'latest';
      dependencies['@vitejs/plugin-vue'] = 'latest';
    } else if (options.framework === 'react') {
      deleteFiles.push(...reactExcludes);
      dependencies['react'] = 'latest';
      dependencies['react-dom'] = 'latest';
      dependencies['@vitejs/plugin-react'] = 'latest';
    }
  }

  // add style dependencies
  if (options.style.includes('tailwindcss')) {
    dependencies['tailwindcss'] = 'latest';
    dependencies['@tailwindcss/vite'] = 'latest';
  }

  if (options.style.includes('sass')) {
    dependencies['sass-embedded'] = 'latest';
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
