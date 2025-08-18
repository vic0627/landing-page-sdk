import { getProjectPath } from '@landing-page-sdk/utils-node';

export default {
  env: {
    foo: 'bar',
    utilsPath: getProjectPath('@landing-page-sdk/utils-node/src/nx.ts'),
  },
};
