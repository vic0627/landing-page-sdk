import { OptionNormalizer } from '@landing-page-sdk/types';
import { isArray, isNumber, isPlainObject, isString } from 'lodash-es';

export default (function (opt, cfg) {
  if (isString(cfg.sitemap)) {
    opt.sitemap.enable = true;
    opt.sitemap.baseUrl['default'] = cfg.sitemap;
  } else if (isPlainObject(cfg.sitemap)) {
    const sitemap = cfg.sitemap!;

    if (isString(sitemap.baseUrl)) {
      opt.sitemap.baseUrl['default'] = sitemap.baseUrl;
    } else if (isPlainObject(sitemap.baseUrl)) {
      opt.sitemap.baseUrl = sitemap.baseUrl;
    }

    if (sitemap.enable === true) {
      opt.sitemap.enable = true;
    }

    if (sitemap.orientation === 'dir') {
      opt.sitemap.orientation = 'dir';
    }

    if (isArray(sitemap.exclude)) {
      opt.sitemap.exclude = sitemap.exclude;
    }

    if (isPlainObject(sitemap.defaults)) {
      const defaults = sitemap.defaults!;

      if (isString(defaults.changefreq)) {
        opt.sitemap.defaults.changefreq = defaults.changefreq;
      }

      if (isNumber(defaults.priority)) {
        opt.sitemap.defaults.priority = defaults.priority;
      }
    }

    if (sitemap.useAliasAsPath === false) {
      opt.sitemap.useAliasAsPath = false;
    }
  }
} satisfies OptionNormalizer);
