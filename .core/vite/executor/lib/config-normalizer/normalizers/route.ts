import { OptionNormalizer, RouteOption } from '@landing-page-sdk/types';
import { isPlainObject } from 'lodash-es';

export default (function (opt, cfg) {
  if (cfg.route === 'flat') {
    opt.route.mode = 'flat';
  } else if (isPlainObject(cfg.route)) {
    const route = cfg.route as RouteOption;

    if (route.mode === 'flat') {
      opt.route.mode = 'flat';
    }

    if (route.orientation === 'file') {
      opt.route.orientation = 'file';
    }
  }
} satisfies OptionNormalizer);
