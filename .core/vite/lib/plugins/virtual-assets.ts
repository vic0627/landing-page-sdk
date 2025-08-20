import { Plugin } from 'vite';
import { Page, SiteOptions } from '../types';
import VA from '../virtual-assets';

export default (pages: Page[], siteOptions: SiteOptions): Plugin => {
  const va = new VA();

  return {
    name: 'vite-plugin-virtual-assets',
    resolveId(id) {
      console.log(id);
      const info = va.get(id);
      if (info) console.log('resolveId', info);
      return info?.resolveId;
    },
    load(id) {
      const info = va.get(id);
      if (info) console.log('load', info);
      if (info) return va.loadFile(info.projPath);
    },
  };
};
