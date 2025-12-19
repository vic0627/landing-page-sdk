import { I18nInfo, I18nLangPack } from './langs';
import { NormalizedSiteConfig } from './normalized';
import { RouteMode } from './types';
import { ViteExecutorSchema } from './schema';
import { RedirectOption } from './options';

export interface PageDataCommon {
  /**
   * 此頁輸出的檔名（相對於站點輸出根）
   */
  filename: string;
  /**
   * 任意環境變數：由 `site.config.js` 注入，模板端以 `import.meta.env.KEY` 可讀
   */
  env?: Record<string, any>;
  /**
   * 供 EJS 模板 include 元件時取得元件路徑
   * - 支援以 `@` 作為 monorepo 內部別名（由執行器解析）
   * - 僅供模板使用；控制器注入時會被過濾（不可序列化）
   */
  $cmp?: (path: string) => string;
  /**
   * 自我參照，避免模板中資料遮蔽
   */
  _data?: PageDataCommon;
}

export interface PageDataI18n {
  /**
   * 此頁語系（多語時存在）
   */
  lang?: string;
  /**
   * 可用語系列表（多語時存在）
   */
  langs?: string[];
  /**
   * 對應語系的字典物件（由 `src/i18n/*.json` 載入）
   */
  i18n?: I18nLangPack;
  /**
   * 完整的字典包（由 `src/i18n/*.json` 載入）
   */
  i18nPack?: I18nLangPack;
  /**
   * 預設語系
   */
  defaultLang?: string;
}

export interface PageDataSite {
  /**
   * 此頁所屬站點名稱（多站時存在）
   */
  site?: string;
  /**
   * 此頁的路由
   */
  route?: string;
}

export type PageData = PageDataCommon & PageDataI18n & PageDataSite & Record<string, any>;

export type PageContext = Omit<Page, 'getContext' | 'data' | 'siteScript' | 'entry' | 'template'> &
  PageDataI18n &
  PageDataSite;

declare global {
  // global vars
}

export interface Page {
  /**
   * 頁面唯一識別符
   */
  name: string;
  /**
   * 頁面的輸出檔名（含語系與多站前綴後的相對路徑）
   */
  filename: string;
  /**
   * 頁面的輸出檔名（根）
   */
  rootFilename: string;
  /**
   * 對應的模板實體檔案路徑（相對於專案根）
   */
  template: string;
  /**
   * 基於 `src/pages` 的路由（不含語系與多站），例如：`/`、`/about/me`
   */
  route?: string;
  /**
   * 此頁的入口（`main.js`）
   */
  entry?: string;
  /**
   * 多站點腳本實體位置
   */
  siteScript?: string;
  /**
   * EJS 可用資料
   */
  data?: PageData;
  site?: string;
  lang?: string;

  getContext(): PageContext;
  stubFor?: string;
}

export interface PagesInfo {
  pages: Page[];
  langInfo: I18nInfo;
  sites: string[];
}

export interface BuildPageOption {
  cli: ViteExecutorSchema;
  cfg: NormalizedSiteConfig;
}
