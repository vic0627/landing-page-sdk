import { OptionNormalizer } from '@landing-page-sdk/types';
import { isPlainObject, isString } from 'lodash-es';

export default (function (opt, cfg) {
  if (isPlainObject(cfg.sourcePath)) {
    const sourcePath = cfg.sourcePath!;

    if (isString(sourcePath.pages)) {
      opt.sourcePath.pages = sourcePath.pages;
    }

    if (isString(sourcePath.components)) {
      opt.sourcePath.components = sourcePath.components;
    }

    if (isString(sourcePath.i18n)) {
      opt.sourcePath.i18n = sourcePath.i18n;
    }

    if (isString(sourcePath.sites)) {
      opt.sourcePath.sites = sourcePath.sites;
    }

    if (isString(sourcePath.public)) {
      opt.sourcePath.public = sourcePath.public;
    }
  }
} satisfies OptionNormalizer);
