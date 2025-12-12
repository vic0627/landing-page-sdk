export interface I18nLangPack {
  [x: string]: string | I18nLangPack;
}

export interface I18nInfo {
  langs: string[];
  langPack: I18nLangPack;
  defaultLang?: string;
}
