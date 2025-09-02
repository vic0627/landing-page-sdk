import { ControllerOption, SDKPlugin } from '@landing-page-sdk/types';
import { getImportStatement } from '../common';
import { isArray, isPlainObject } from 'lodash-es';

export default (({ siteOptions }) => {
  let { controller } = siteOptions;

  if (!controller) {
    return;
  }

  let controllers!: ControllerOption[];

  if (isPlainObject(controller)) {
    controllers = [controller as ControllerOption];
  } else if (isArray(controller)) {
    controllers = controller;
  } else {
    throw new TypeError(`'controller' only accept plain object or array`);
  }

  return {
    name: 'vite-plugin-sites-injector',
    transform(code, id) {
      // console.log(id)
    },
  };
}) satisfies SDKPlugin;
