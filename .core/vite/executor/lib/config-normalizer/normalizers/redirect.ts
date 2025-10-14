import { OptionNormalizer, RedirectOption } from '@landing-page-sdk/types';
import { isFunction, isPlainObject, isString } from 'lodash-es';

export default (function (opt, cfg) {
  if (cfg.redirect === false) {
    opt.redirect.enable = false;
  } else if (isPlainObject(cfg.redirect)) {
    const redirect = cfg.redirect as RedirectOption;

    if (redirect.enable === false) {
      opt.redirect.enable = false;
    }

    if (redirect.stub === true) {
      opt.redirect.stub = true;
    }

    if (isString(redirect.defaultLang)) {
      opt.redirect.defaultLang = redirect.defaultLang;
    }

    if (isFunction(redirect.transform)) {
      opt.redirect.transform = redirect.transform;
    }
  }
} satisfies OptionNormalizer);
