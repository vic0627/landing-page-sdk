import { getCookie } from './cookie';

type Langs = string;

/**
 * 從當前 URL 的路徑中提取語言代碼。
 *
 * 該函式根據支援的語言列表 `supportLangs`，從以下兩種格式中匹配語言代碼：
 * 1. `/Langs/`：例如 `/path/to/zh/index.html` 中的 `zh`。
 * 2. `_Langs.html`：例如 `/path/to/index_zh.html` 中的 `zh`。
 *
 * 如果 URL 中未包含符合格式的語言代碼，則返回 `null`。
 *
 * @param supportLangs - 支援的語言代碼列表，用於生成正規表示式進行匹配。
 * @returns 返回匹配到的語言代碼。如果未匹配到，返回 `null`。
 */
export function getLangFromPath(supportLangs: Langs[]): Langs | null {
  const langsPattern = supportLangs.join('|');
  const regexp = new RegExp(
    `(?:/(${langsPattern})/)|(?:_(${langsPattern})\\.html)`,
    'i'
  );
  const [, $1, $2] = (location.pathname.match(regexp) ?? []) as Langs[];

  return $1 || $2 || null;
}

/**
 * 偵測使用者的語言設置，並返回符合支援語言的語言代碼。
 *
 * 偵測語言的優先級如下：
 * 1. 從根元素提取 `lang` 屬性的值。
 * 2. 從 URL 路徑中提取語言代碼。
 * 3. 從 URL 查詢參數中提取 `lang` 的值。
 * 4. 從 Cookie 中提取 `lang` 的值。
 * 5. 從瀏覽器的 `navigator.language` 提取前兩個字母作為語言代碼。
 *
 * 如果未能從上述方法中找到支援的語言代碼，則返回預設語言 `defaultLang`。
 * 若預設語言不在支援語言清單內，則返回支援語言清單中的第一個語言。
 *
 * @param supportedLangs - 支援的語言代碼列表。預設為常見的多語言代碼。
 * @param defaultLang - 預設語言代碼。當未能找到符合的語言代碼時，將返回此值。
 * @returns 返回檢測到的語言代碼，或在未檢測到有效語言時返回 `defaultLang` 或 `supportedLangs` 的第一個語言。
 */
export function detectLang(
  supportedLangs: Langs[] = [],
  defaultLang: Langs = 'en'
): Langs {
  const detectResult = [
    document.documentElement.lang,
    getLangFromPath(supportedLangs),
    new URLSearchParams(location.search).get('lang'),
    getCookie('lang'),
    navigator.language,
  ];

  for (const lang of detectResult)
    if (lang && supportedLangs.includes(lang as Langs)) return lang as Langs;

  if (supportedLangs.includes(defaultLang)) return defaultLang;

  return supportedLangs[0];
}

export function detectLangLegacy(
  supportedLangs: Langs[] = [],
  defaultLang: Langs = 'en'
) {
  const langFromUrl = new URLSearchParams(window.location.search).get('lang');
  const langFromCookie = getCookie('lang');
  const langFromNavigator = navigator.language;
  let lang = langFromUrl || langFromCookie || langFromNavigator;
  if (!supportedLangs.includes(lang as Langs)) lang = defaultLang;
  return lang as Langs;
}
