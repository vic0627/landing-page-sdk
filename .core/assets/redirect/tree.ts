import { detectLang, join, getPageContext } from '@landing-page-sdk/utils-browser';

const { langs, defaultLang } = getPageContext();
const isFileOrientated = import.meta.env['SDK_CONFIG'].route.orientation === 'file';
let dest = join('./', detectLang(langs, defaultLang), isFileOrientated ? 'index.html' : '')

if (!isFileOrientated && !dest.endsWith('/')) {
  dest += '/';
}

dest += location.search;

window.location.href = dest;
