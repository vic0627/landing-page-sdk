import { detectLangLegacy, getPageContext } from '@landing-page-sdk/utils-browser';

const { defaultLang, langs } = getPageContext();
const dest = `./index_${detectLangLegacy(langs, defaultLang)}.html${location.search}`;

window.location.href = dest;
