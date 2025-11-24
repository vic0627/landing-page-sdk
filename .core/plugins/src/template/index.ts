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

export async function templateGenerator(
  tree: Tree,
  options: TemplateGeneratorSchema
) {
  const projectRoot = options.path.endsWith('/') ? options.path.slice(0, -1) : options.path;

  const source = join(__dirname, 'files');
  const depthRel = projectRoot
    .split('/')
    .map(() => '../')
    .join('');

  const ext = options.useTs ? 'ts' : 'js';

  generateFiles(tree, source, projectRoot, { ...options, depthRel, ext });

  const deleteFiles: string[] = [];
  const dependencies: Record<string, string> = {};
  const vueExtracts: string[] = [
    `src/pages/app.${ext}x`,
    `src/pages/main.${ext}x`,
    `src/components/counter.${ext}x`,
    `src/components/react-logo.${ext}x`,
    `src/components/vite-logo.${ext}x`,
    'public/__ASSETS__/react.svg'
  ];
  const reactExtracts: string[] = [
    'src/pages/app.vue',
    `src/pages/main.${ext}`,
    'src/components/counter.vue',
    'src/components/vue-logo.vue',
    'src/components/vite-logo.vue',
    'public/__ASSETS__/vue.svg'
  ];

  if (options.framework === 'none') {
    deleteFiles.push(
      `src/composables/use-i18n.${ext}`,
      ...vueExtracts,
      ...reactExtracts,
    );
  } else {
    deleteFiles.push(`src/composables/counter.${ext}`);

    if (options.framework === 'vue') {
      deleteFiles.push(...vueExtracts);
      dependencies['vue'] = 'latest';
      dependencies['@vitejs/plugin-vue'] = 'latest';
    } else if (options.framework === 'react') {
      deleteFiles.push(...reactExtracts);
      dependencies['react'] = 'latest';
      dependencies['react-dom'] = 'latest';
      dependencies['@vitejs/plugin-react'] = 'latest';
    }
  }

  if (options.style.includes('tailwindcss')) {
    dependencies['tailwindcss'] = 'latest';
    dependencies['@tailwindcss/vite'] = 'latest';
  } else if (options.style.includes('sass')) {
    dependencies['sass-embedded'] = 'latest';
  } else {
    deleteFiles.push('src/styles/main.scss');
  }

  deleteFiles.forEach((file) => tree.delete(join(projectRoot, file)));

  const pkg = readJson(tree, join(projectRoot, 'package.json'));

  pkg.dependencies = {
    ...pkg.dependencies,
    ...dependencies,
  };

  writeJson(tree, join(projectRoot, 'package.json'), pkg);

  await formatFiles(tree);

  return () => {
    installPackagesTask(tree);
  }
}

export default templateGenerator;
