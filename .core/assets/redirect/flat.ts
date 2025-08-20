import { detectLangLegacy } from '@landing-page-sdk/utils-browser';

const langs = import.meta.env['langs'] as string[] | undefined;
const lang = import.meta.env['defaultLang'] as string | undefined;
const dest = `./index_${detectLangLegacy(langs, lang)}.html${location.search}`;
// console.log(dest);
window.location.href = dest;
