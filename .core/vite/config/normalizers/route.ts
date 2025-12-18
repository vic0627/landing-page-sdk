import { OptionNormalizer, RouteHiddenRule, RouteOption } from '@landing-page-sdk/types';
import { isArray, isFunction, isPlainObject } from 'lodash-es';

export default (function (opt, cfg) {
  if (cfg.route === 'flat') {
    opt.route.mode = 'flat';
  } else if (isPlainObject(cfg.route)) {
    const route = cfg.route as RouteOption;

    if (route.mode === 'flat') {
      opt.route.mode = 'flat';
    }

    if (route.resolution === 'abs') {
      opt.route.resolution = 'abs';
    }

    if (route.orientation === 'file') {
      opt.route.orientation = 'file';
    }

    if (route.useSiteAsPath === true) {
      opt.route.useSiteAsPath = true;
    }

    if (isPlainObject(route.hidden)) {
      opt.route.hidden = [route.hidden as RouteHiddenRule]
    } else if (isArray(route.hidden)) {
      opt.route.hidden = route.hidden
    }
  }
} satisfies OptionNormalizer);
