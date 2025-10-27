import { statSync } from 'fs';
import { isArray, isPlainObject, isString } from 'lodash-es';
import {
  SiteConfig,
  NormalizedSiteConfig,
  SiteConfigNormalizer,
} from '@landing-page-sdk/types';
import { loadHMR, resolve } from '@landing-page-sdk/utils-node';
import controllerNormalizer from './normalizers/controller';
import outputNormalizer from './normalizers/output';
import redirectNormalizer from './normalizers/redirect';
import routeNormalizer from './normalizers/route';
import sitemapNormalizer from './normalizers/sitemap';
import sourcePathNormalizer from './normalizers/source-path';

const normalize: SiteConfigNormalizer = (cfg) => {
  const opt: NormalizedSiteConfig = {
    route: {
      mode: 'tree',
      resolution: 'rel',
      orientation: 'dir',
      useSiteAsPath: false,
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
      useSiteAsPath: false,
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

function readRaw(filePath: string): SiteConfig {
  try {
    const isFile = statSync(filePath).isFile();

    if (!isFile) return {};

    const mod = loadHMR<{ default: SiteConfig }>(resolve(filePath));

    return mod?.default ?? {};
  } catch {
    return {};
  }
}

export { normalize, readRaw };
