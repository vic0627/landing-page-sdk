import { MinifyTargets, OptionNormalizer } from '@landing-page-sdk/types';
import { isArray, isNumber, isPlainObject, isString } from 'lodash-es';

export default (function (opt, cfg) {
  if (isPlainObject(cfg.output)) {
    const output = cfg.output!;
    const minifyTargets = ['html', 'js', 'css'] as MinifyTargets[];

    if (output.minify === false) {
      opt.output.minify.html = opt.output.minify.js = opt.output.minify.css = false;
    } else if (isString(output.minify) && minifyTargets.includes(output.minify)) {
      // turn off all, then enable the specified target only
      for (const target of minifyTargets) {
        opt.output.minify[target] = output.minify === target;
      }
    } else if (isArray(output.minify)) {
      for (const target of minifyTargets) {
        opt.output.minify[target] = output.minify.includes(target);
      }
    }

    if (output.versioning === 'soft') {
      opt.output.versioning = 'soft';
    }

    if (output.assetsResolution === 'rel') {
      opt.output.assetsResolution = 'rel';
    }

    if (isNumber(output.threshold)) {
      opt.output.threshold = output.threshold;
    }

    if (isString(output.dist)) {
      opt.output.dist = output.dist;
    }
  }
} satisfies OptionNormalizer);
