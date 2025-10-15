import {
  NormalizedSiteConfig,
  SiteConfigNormalizer,
} from '@landing-page-sdk/types';
import { isArray, isPlainObject, isString } from 'lodash-es';
import controllerNormalizer from './normalizers/controller';
import outputNormalizer from './normalizers/output';
import redirectNormalizer from './normalizers/redirect';
import routeNormalizer from './normalizers/route';
import sitemapNormalizer from './normalizers/sitemap';
import sourcePathNormalizer from './normalizers/source-path';

const normalizer: SiteConfigNormalizer = (cfg) => {
  const opt: NormalizedSiteConfig = {
    route: {
      mode: 'tree',
      resolution: 'rel',
      orientation: 'dir',
      flatFileNaming(phase, nameOrDir, lang) {
        if (phase === 'init') {
          nameOrDir = nameOrDir.replace(/\//g, '_');
        } else if (phase === 'localize') {
          nameOrDir = nameOrDir + '_' + lang;
        }
        return nameOrDir;
      },
    },
    output: {
      minify: {
        html: true,
        js: true,
        css: true,
      },
      versioning: 'hard',
      assetsResolution: 'abs',
      threshold: 0,
    },
    redirect: {
      enable: true,
      stub: false,
      defaultLang: '',
      transform() {},
    },
    sourcePath: {
      pages: './src/pages',
      components: './src/components',
      i18n: './src/i18n',
      sites: './src/sites',
      public: './public',
    },
    plugins: [],
    env: {},
    controller: [],
    sitemap: {
      enable: false,
      baseUrl: {},
      orientation: 'file',
      exclude: [],
      defaults: {},
      useAliasAsPath: true,
    },
    mock: '@landing-page-sdk/assets/mock',
  };

  controllerNormalizer(opt, cfg);
  outputNormalizer(opt, cfg);
  redirectNormalizer(opt, cfg);
  routeNormalizer(opt, cfg);
  sitemapNormalizer(opt, cfg);
  sourcePathNormalizer(opt, cfg);

  if (isArray(cfg.plugins)) {
    opt.plugins = cfg.plugins;
  }

  if (isPlainObject(cfg.env)) {
    opt.env = cfg.env!;
  }

  if (cfg.mock === false) {
    opt.mock = false;
  } else if (isString(cfg.mock)) {
    opt.mock = cfg.mock;
  }

  return opt;
};

export default normalizer;
