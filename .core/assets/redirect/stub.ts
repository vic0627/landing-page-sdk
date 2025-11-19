import { detectLang, join } from '@landing-page-sdk/utils-browser';

const { rootFilename } = __SDK_PAGE_CTX__
const { langs, defaultLang } = __SDK_PAGE_CTX__.data;

const lang = detectLang(langs, defaultLang);
const depth = rootFilename.split('/').filter(Boolean).length - 1;
const relPath = Array.from({ length: depth }, () => '..').join('/');
const dest = join(relPath, lang, rootFilename) + location.search;

window.location.href = dest;
