import { detectLangLegacy } from '@landing-page-sdk/utils-browser';

const { defaultLang, langs } = __SDK_PAGE_CTX__;
const dest = `./index_${detectLangLegacy(langs, defaultLang)}.html${location.search}`;

window.location.href = dest;
