import { detectLang } from '@landing-page-sdk/utils-browser';

const langs = import.meta.env['langs'] as string[] | undefined;
const lang = import.meta.env['defaultLang'] as string | undefined;

window.location.href = `./${detectLang(langs, lang)}/${
  location.search
}`;
