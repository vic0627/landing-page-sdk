import { isString } from 'lodash-es';
import { getPageContext } from '@landing-page-sdk/utils-browser';

export default function () {
  const { i18n } = getPageContext();

  if (!i18n) {
    throw new Error('Missing locale context for i18n');
  }

  const langPack = i18n;

  return function (key: string, ...args: any[]) {
    try {
      const keys = key.split('.');
      let pack = langPack;
      let k;
      while ((k = keys.shift())) {
        pack = pack[k];
      }
      if (isString(pack)) {
        return pack.replace(/{(\d+)}/g, (match, index) => args[index]);
      }
      throw new Error();
    } catch {
      return key;
    }
  };
}
