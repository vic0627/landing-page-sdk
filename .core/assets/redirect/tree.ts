import { detectLang, join } from '@landing-page-sdk/utils-browser';

const { lang, langs } = __SDK_PAGE_CTX__.data
const dest = join('./', detectLang(langs, lang), 'index.html') + location.search;

window.location.href = dest;