import { Plugin, PluginOption } from 'vite';
import { DOMWindow } from 'jsdom';

export type ViteMode = 'dev' | 'build' | 'preview';

export type RouteMode = 'flat' | 'tree';

export type Phase = 'pre' | 'post';

export type MinifyTargets = 'html' | 'js' | 'css';

export type Versioning = 'hard' | 'soft';

export type AssetsBaseType = 'abs' | 'rel';

export type ScriptSourceType = 'inline' | 'bundle';

export interface ViteExecutorSchema {
  cwd: string;
  mode: ViteMode;
  verbose?: boolean;
  host?: boolean;
  port?: number;
  /**
   * landing page 設定檔
   * @default 'site.config.js'
   */
  config?: string;
  sites?: string;
  minify?: boolean | string;
  versioning?: Versioning;
  assets?: AssetsBaseType;
}

export interface ControllerTarget {
  routes: string | string[];
  lang?: string | string[];
  site?: string | string[];
}

export interface ControllerInjection {
  /** @default 'bundle' */
  type?: ScriptSourceType;
  /** @default 'post' */
  placement?: Phase;

  /** only works when type set to 'inline' */
  /** @default 'head' */
  appendTo?: 'head' | 'body';
  /** @default true */
  bundle?: boolean;
}

export interface ControllerOption {
  name: string;
  /** @default '/' */
  targets?: string | string[] | ControllerTarget;
  /** @default 'bundle' */
  injection?: ScriptSourceType | ControllerInjection;
}

export interface StandardControllerOption {
  name: string;
  targets: {
    routes: string[];
    lang: string[];
    site: string[];
  };
  injection: Required<ControllerInjection>;
}

export interface SitemapOptions {
  /** 每個 site 的 baseUrl */
  baseUrl: string | Record<string, string>;
  /**
   * 是否輸出 sitemap
   * @default true
   */
  enable?: boolean;
  /**
   * 控制 sitemap 內連結是要用「檔名顯式」還是「目錄式」的 URL 格式
   * @default 'file'
   */
  orientation?: 'file' | 'dir';
  /** 排除規則（route 匹配）*/
  exclude?: Array<string | RegExp>;
  /** 預設欄位（可被 page.data.sitemap 覆寫） */
  defaults?: { changefreq?: 'daily' | 'weekly' | 'monthly'; priority?: number };
  /**
   * @default true
   */
  useAliasAsPath?: boolean;
}

export interface RedirectOptions {
  /**
   * @default true
   */
  enable?: boolean;
  /**
   * 在沒有語系前綴的路由 (例如 `/about/me`) 自動生成一個空白頁，
   * 用來偵測使用者語系並立即轉向到對應的語系路由 (例如 `/en/about/me`)。
   * @default false
   */
  stub?: boolean;
  defaultLang?: string;
  /**
   * 用來操作轉向頁的 DOM
   * @description
   * 注意：轉向邏輯本身不可修改，只能針對頁面結構做調整，
   * 例如新增 `<meta>` 標籤、修改 `<title>`、插入其他元素等。
   * @param page 當前處理的頁面資訊
   * @this DOMWindow JSDOM 的 window 物件，可用來直接操作頁面 DOM
   */
  transform?(this: DOMWindow, page: readonly Page): void | Promise<void>;
}

export interface OutputOptions {
  /**
   * 是否壓縮輸出的檔案
   * - `true`：壓縮所有類型（HTML、JS、CSS）。
   * - `false`：不壓縮。
   * - 指定字串：只壓縮該類型，例如 `'js'`。
   * - 陣列：壓縮多個類型，例如 `['html', 'css']`。
   * @default true
   */
  minify?: boolean | MinifyTargets | MinifyTargets[];
  /**
   * 輸出檔案的版本化方式
   * - `'hard'`：檔名帶雜湊，例如 `[name].[hash].[ext]`。
   * - `'soft'`：檔名不變，透過查詢參數附加雜湊，例如 `[name].[ext]?v=[hash]`。
   * @default 'hard'
   */
  versioning?: Versioning;
  /**
   * 輸出資源的路徑型態
   * - `'abs'`：使用絕對路徑，例如 `/__ASSETS__/main.hash.js`。
   * - `'rel'`：使用相對路徑，例如在 `/en/about/me/index.html` 會轉換成
   *   `../../../__ASSETS__/main.hash.js`。
   * @description
   * 自動轉換會套用在 HTML 與 CSS 的資源路徑。
   * JS 檔因技術限制，僅支援在 `/` 與 `./` 兩種前綴間互換。
   * @default 'abs'
   */
  assets?: AssetsBaseType;
  /**
   * 多媒體資產大小警示閥值 (單位：Byte)
   * @description
   * 在 build 時檢查資產大小，若超過此值會輸出警告訊息。
   */
  threshold?: number;
}

export interface SiteOptions {
  /**
   * 輸出的路由結構呈現
   * - `'tree'`: 樹狀結構，語系在前，頁面結構同 `src/pages`。
   * - `'flat'`: 平坦結構，所有輸出頁面都在根目錄，頁面名稱將以 `路徑_語系.html` 轉換。例如英文語系的 `src/pages/about/me/index.html` 將會輸出為 `about_me_en.html`。
   * @default 'tree'
   */
  routeMode?: RouteMode;
  output?: OutputOptions;
  /** */
  redirect?: boolean | RedirectOptions;
  /**
   * 專案中各類資源的來源路徑設定。
   */
  sourcePath?: {
    /**
     * 頁面檔案路徑
     * @default './src/pages'
     */
    pages?: string;
    /**
     * 元件檔案路徑
     * @default './src/components'
     */
    components?: string;
    /**
     * 多語資源檔案路徑
     * @default './src/i18n'
     */
    i18n?: string;
    /**
     * 多站點設定檔路徑
     * @default './src/sites'
     */
    sites?: string;
    /**
     * 靜態資源路徑
     * @default './public'
     */
    public?: string;
  };
  /**
   * vite 插件
   */
  plugins?: PluginOption[];
  env?: Record<string, any>;
  /**
   * 控制器注入設定
   * - **name**：控制器名稱，必須對應到
   *   `@landing-page-sdk/assets/controller/` 底下的檔案路徑。
   *   需提供完整子路徑與檔名，例如：`"product-a/mount-urls.ts"`。
   * - **targets**：指定要注入到哪些頁面。
   *   - 為字串時：必須是基於 `src/pages` 的絕對路徑，例如 `"/about/me"`、`"/"` (首頁)。
   *   - 為陣列時：可指定多個頁面。
   *   - 為物件時：可指定更細部條件，如限制語系 (`lang`)、站點 (`site`) 等。
   *     多個條件會取交集。
   * - **injection**：注入方式。
   *   - `"bundle"`：隨該頁面的入口檔一起打包。
   *   - `"inline"`：以 `<script>` 內聯注入 HTML。
   *   - 若為物件：可進一步指定細部條件，例如：
   *     - `placement`：注入於頁面程式碼的前或後，預設 `'post'`。
   *     - `appendTo`：僅在 `inline` 模式下有效，指定插入位置，預設 `'head'`。
   *     - `bundle`：在 `inline` 模式下是否先進行 bundle，預設 `true`。
   *
   * 可設定單一控制器或多個控制器。
   */
  controller?: ControllerOption | ControllerOption[];
  sitemap?: string | SitemapOptions;
  /**
   * API 模擬
   * - 為 `false` 時關閉模擬功能
   * - 為字串時可指定 handlers 存放路徑
   * @default '@landing-page-sdk/assets/mock'
   */
  mock?: boolean | string;
}

/**
 * EJS 可用的頁面資料（Page.data）規格彙整
 *
 * 來源與時機（由 .core/vite/executor 組裝）：
 * - findPages(): 注入基礎欄位 `filename`、`env`、`$cmp`，並建立 `_data` 指向自身（shadowData）。
 * - localizePages(): 多語時注入 `lang`、`langs`、`i18n`，並覆寫 `filename` 為語系化後路徑。
 * - multiSitesPages(): 多站時注入 `site`、`alias`。
 * - redirect/stub 頁：與一般頁面相同，依需求帶入 `lang`、`langs`、`i18n`、`filename`。
 *
 * 使用場景：
 * - 模板（EJS）中直接使用，如 `<%= lang %>`、`<%= i18n.key %>`、`<%- include($cmp('logo'), _data) %>`。
 * - 控制器注入（auto-controller）會嘗試 JSON.stringify 每個值，無法序列化的值（例如 `$cmp` 函式）會被過濾。
 */
export interface PageDataCommon {
  /** 此頁輸出的檔名（相對於站點輸出根） */
  filename: string;
  /** 任意環境變數：由 `site.config.js.env` 注入，模板端以 `import.meta.env.KEY` 可讀 */
  env?: Record<string, any>;
  /**
   * 供 EJS 模板 include 元件時取得元件路徑
   * - 支援以 `@` 作為 monorepo 內部別名（由執行器解析）
   * - 僅供模板使用；控制器注入時會被過濾（不可序列化）
   */
  $cmp?: (path: string) => string;
  /** shadowData 產生的自我參照，避免模板中資料遮蔽 */
  _data?: any;
}

export interface PageDataI18n {
  /** 此頁語系（多語時存在） */
  lang?: string;
  /** 可用語系列表（多語時存在） */
  langs?: string[];
  /** 對應語系的字典物件（由 `src/i18n/*.json` 載入） */
  i18n?: I18nLangPack;
}

export interface PageDataSite {
  /** 此頁所屬站點名稱（多站時存在） */
  site?: string;
  /** 站點別名（多站腳本檔名的後綴，如 `site-a.alias.js` 的 alias） */
  alias?: string;
}

/** Page.data 的型別彙整（保留擴充彈性） */
export type PageData = PageDataCommon & PageDataI18n & PageDataSite & Record<string, any>;

export interface Page {
  name: string;
  /** 目前頁面的輸出檔名（含語系與多站前綴後的相對路徑） */
  filename: string;
  /** 對應的模板實體檔案路徑（相對於專案根） */
  template: string;
  /**
   * 基於 `src/pages` 的路由（不含語系與多站），例如：`/`、`/about/me`
   * - 用於控制器目標匹配與 sitemap 同內容頁分組（跨語互指）。
   */
  route?: string;
  /** 若存在，為此頁的客製入口（`main.js`），相對於專案根 */
  entry?: string;
  /** 多站腳本在入口中的相對路徑（由 sites-injector 計算） */
  siteScript?: string;
  /** EJS 可用資料，詳見 PageData */
  data?: PageData;
}

export interface PagesInfo {
  pages: Page[];
  langInfo: I18nInfo;
  sites: Record<string, string>;
}

export interface I18nLangPack {
  [x: string]: string | I18nLangPack;
}

export interface I18nInfo {
  langs: string[];
  langPack: I18nLangPack;
}

export interface SiteContext {
  readonly pagesInfo: PagesInfo;
  readonly cliOptions: ViteExecutorSchema;
  readonly siteOptions: SiteOptions;
}

export type SDKPlugin = (ctx: SiteContext) => PluginOption;
