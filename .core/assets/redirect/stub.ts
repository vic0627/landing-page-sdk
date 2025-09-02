import { detectLang } from '@landing-page-sdk/utils-browser';

declare var filename: string;

const langs = import.meta.env['langs'] as string[] | undefined;
const lang = import.meta.env['defaultLang'] as string | undefined;
const depth = filename.split('/').length - 1;
const relPath = Array.from({ length: depth }, () => '..').join('/');
const dest = `${relPath}/${detectLang(langs, lang)}/${filename}${
  location.search
}`;

window.location.href = dest;
