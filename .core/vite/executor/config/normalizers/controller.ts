import {
  ControllerInjection,
  ControllerOption,
  NormalizedControllerOption,
  OptionNormalizer,
} from '@landing-page-sdk/types';
import { isArray, isPlainObject, isString } from 'lodash-es';

export default (function (opt, cfg) {
  if (isPlainObject(cfg.controller)) {
    opt.controller = [
      normalizeControllerOption(cfg.controller as ControllerOption),
    ];
  } else if (isArray(cfg.controller)) {
    opt.controller = cfg.controller.map(normalizeControllerOption);
  }
} satisfies OptionNormalizer);

function normalizeControllerOption(
  controllerOption: ControllerOption
): NormalizedControllerOption {
  const opt: NormalizedControllerOption = {
    name: controllerOption.name,
    targets: {
      routes: ['/'],
      lang: [],
      site: [],
    },
    injection: {
      type: 'bundle',
      placement: 'post',
      appendTo: 'head',
      bundle: true,
    },
  };

  if (isString(controllerOption.targets)) {
    opt.targets.routes = [controllerOption.targets];
  } else if (isArray(controllerOption.targets)) {
    opt.targets.routes = controllerOption.targets;
  } else if (isPlainObject(controllerOption.targets)) {
    const targets = controllerOption.targets!;

    if (isString(targets.routes)) {
      opt.targets.routes = [targets.routes];
    } else if (isArray(targets.routes)) {
      opt.targets.routes = targets.routes;
    }

    if (isString(targets.lang)) {
      opt.targets.lang = [targets.lang];
    } else if (isArray(targets.lang)) {
      opt.targets.lang = targets.lang;
    }

    if (isString(targets.site)) {
      opt.targets.site = [targets.site];
    } else if (isArray(targets.site)) {
      opt.targets.site = targets.site;
    }
  }

  if (controllerOption.injection === 'inline') {
    opt.injection.type = 'inline';
  } else if (isPlainObject(controllerOption.injection)) {
    const injection = controllerOption.injection as ControllerInjection;

    if (injection.type === 'inline') {
      opt.injection.type = 'inline';
    }

    if (injection.placement === 'pre') {
      opt.injection.placement = 'pre';
    }

    if (injection.appendTo === 'body') {
      opt.injection.appendTo = 'body';
    }

    if (injection.bundle === false) {
      opt.injection.bundle = false;
    }
  }

  return opt;
}
