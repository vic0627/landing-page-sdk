import { DOMWindow } from 'jsdom';
import { PluginOption } from 'vite';
import { BuildOptions } from 'esbuild';
import {
  ScriptSourceType,
  Phase,
  HTMLAppendTarget,
  Versioning,
  Resolution,
  MinifyTargets,
  RouteMode,
  DestOrientation,
} from './types';
import { Page } from './langs';

export interface ControllerTarget {
  routes: string | string[];
  lang?: string | string[];
  site?: string | string[];
}

export interface ControllerInjection {
  /**
   * 注入至 html 或打包進 js
   * @default 'bundle'
   */
  type?: ScriptSourceType;
  /**
   * @default 'post'
   */
  placement?: Phase;
  /**
   * html 注入位置
   *
   * 注意：僅在 `type: 'inline'` 時生效
   *
   * @default 'head'
   */
  appendTo?: HTMLAppendTarget;
  /**
   * 注入 html 前是否先進行腳本打包
   *
   * 注意：僅在 `type: 'inline'` 時生效
   *
   * @default true
   */
  bundle?: boolean;
  esbuildOptions?: Omit<BuildOptions, 'entryPoints' | 'bundle' | 'write' | 'plugins' | 'inject'>;
}

export interface ControllerOption {
  /**
   * 控制器名稱
   * - 參考 `.core/assets/controller/*`
   */
  name: string;
  /**
   * 控制器注入目標
   * - `string`: 指定單一個要注入的路徑，不分站點、語系
   * - `string[]`: 指定多個要注入的路徑，不分站點、語系
   * - `ControllerTarget`: 特定站點、語系、路由，取各項設定交集
   * @default '/'
   */
  targets?: string | string[] | ControllerTarget;
  /**
   * 控制器注入方式
   * - `inline`: 以內連腳本直接注入 html 中，預設注入 `<head>` 末尾
   * - `bundle`: 隨其他程式進 vite 打包流程，預設注入該頁 main.js
   * @default 'bundle'
   */
  injection?: ScriptSourceType | ControllerInjection;
}

export interface SitemapDefaults {
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
}

export interface SitemapOption {
  /**
   * 每個 site 的 baseUrl
   */
  baseUrl: string | Record<string, string>;
  /**
   * 是否輸出 sitemap
   * @default false
   */
  enable?: boolean;
  /**
   * 控制 sitemap 內連結是要用「檔名顯式」還是「目錄式」的 URL 格式
   * @default 'file'
   */
  orientation?: DestOrientation;
  /**
   * 排除規則（route 匹配）
   */
  exclude?: (string | RegExp)[];
  /**
   * 預設欄位（可被 page.data.sitemap 覆寫）
   */
  defaults?: SitemapDefaults;
  /**
   * @default false
   */
  useSiteAsPath?: boolean;
}

export interface RedirectOption {
  /**
   * 在根目錄自動生成一個空白頁，
   * 用來偵測使用者語系並立即轉向到對應的語系首頁。
   * @default true
   */
  enable?: boolean;
  /**
   * 在沒有語系前綴的路由 (例如 `/about/me`) 自動生成一個空白頁，
   * 用來偵測使用者語系並立即轉向到對應的語系路由 (例如 `/en/about/me`)。
   * @default false
   */
  stub?: boolean;
  /**
   * 預設的跳轉語系
   * @deprecated
   */
  defaultLang?: string;
  /**
   * 用來操作轉向頁的 DOM
   *
   * 注意：轉向邏輯本身不可修改，只能針對頁面結構做調整，
   * 例如新增 `<meta>` 標籤、修改 `<title>`、插入其他元素等。
   *
   * @param page 當前處理的頁面資訊
   * @this DOMWindow JSDOM 的 window 物件，可用來直接操作頁面 DOM
   */
  transform?(this: DOMWindow, page: readonly Page): void | Promise<void>;
}

export interface OutputOption {
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
   *
   * 注意：僅在 html 生效
   *
   * @default 'abs'
   */
  assetsResolution?: Resolution;
  /**
   * 多媒體資產大小警示閥值 (單位：Byte)
   *
   * 在 build 時檢查資產大小，若超過此值會輸出警告訊息。
   */
  threshold?: number;
}

export interface RouteOption {
  /**
   * 路由結構
   * - `tree`: 樹狀結構，語系在前，頁面結構同 `src/pages`。
   * - `flat`: 平坦結構，所有輸出頁面都在根目錄，頁面名稱預設以 `路徑_語系.html` 轉換。例如英文語系的 `src/pages/about/me/index.html` 將會輸出為 `about_me_en.html`。
   * @default 'tree'
   */
  mode?: RouteMode;
  /**
   * `data-to` 站內跳轉連結渲染後的路徑型態
   * @default 'rel'
   */
  resolution?: Resolution;
  /**
   * `data-to` 站內跳轉連結為 dir-based 還是 file-based
   * - dir-based: 斜線結尾。例如 `/about/me/`
   * - file-based: 明確指向 html。例如 `/about_me_zh.html`
   *
   * 注意：`dir` 僅在 `mode: 'tree'` 時生效
   *
   * @default 'dir'
   */
  orientation?: DestOrientation;
  /**
   * @default false
   */
  useSiteAsPath?: boolean;
}

export interface SourcePathOption {
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
   * 多站點腳本路徑
   * @default './src/sites'
   */
  sites?: string;
  /**
   * 靜態資源路徑
   * @default './public'
   */
  public?: string;
}

export interface SiteConfig {
  /**
   * 路由設定
   * @default 'tree'
   */
  route?: RouteMode | RouteOption;
  /**
   * 輸出設定
   */
  output?: OutputOption;
  /**
   * 語系導向頁設定
   */
  redirect?: boolean | RedirectOption;
  /**
   * 資源來源路徑設定
   */
  sourcePath?: SourcePathOption;
  /**
   * vite 插件
   */
  plugins?: PluginOption[];
  /**
   * 環境變數設定
   */
  env?: Record<string, any>;
  /**
   * 控制器注入設定
   */
  controller?: ControllerOption | ControllerOption[];
  /**
   * sitemap 輸出設定
   */
  sitemap?: string | SitemapOption;
  /**
   * API 模擬設定
   * - 為 `false` 時關閉模擬功能
   * - 為字串時可指定 handlers 存放路徑
   * @default '@landing-page-sdk/assets/mock'
   */
  mock?: boolean | string;
}
