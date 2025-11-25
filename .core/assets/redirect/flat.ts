import { detectLangLegacy } from '@landing-page-sdk/utils-browser';

const { lang, langs } = __SDK_PAGE_CTX__.data;
const dest = `./index_${detectLangLegacy(langs, lang)}.html${location.search}`;

window.location.href = dest;
