// import { defineConfig } from 'vite'
// import { resolve, join } from 'node:path'
// import { createMpaPlugin } from 'vite-plugin-virtual-mpa'
// import { decoratePagesByLangs, findPages, injectDataToPages, loadLangs, rewrites } from './utils.js'

// const getPath = (...paths) => resolve(process.cwd(), ...paths)

// const root = getPath()
// const pages = findPages(getPath('src/pages'), root)
// injectDataToPages(pages, {
//   useCmp: (...paths) => resolve('/src/components', ...paths),
// })
// const { langs, langPack } = loadLangs('src/i18n')
// decoratePagesByLangs(pages, langPack, langs)

// console.log(pages)

// const alias = {
//   '@': getPath('src'),
// }

// export default defineConfig({
//   resolve: {
//     alias,
//   },
//   plugins: [
//     createMpaPlugin({
//       pages,
//       rewrites,
//     }),
//   ],
// })

import { getPath, getPathFromRoot } from '@landing-page-sdk/utils-node';

console.log('getPath', getPath());
console.log('getPathFromRoot', getPathFromRoot());

export default {};
