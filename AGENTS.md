# Landing Page SDK

> **This project is still under construction**

這是一個行銷落地頁生產平台，以簡易的操作介面與高彈性的配置，供操作人員快速建立多頁面、多語系、多站點的靜態網站。

## 功能概覽

- [] 單/多頁面應用
- [] 支援多語系
- [] 多站點輸出
- [] 目錄式（tree）/檔名式（flat）路由策略
- [] sitemap 生成
- [] 硬/軟資產版本化
- [] 絕對/相對資產路徑
- [] 多媒體資產大小警示閥
- [] 客戶端語言轉向頁
- [] 一鰎新站腳手架
- [] 自動腳本注入
- [] 後端接口模擬
- [] 元件系統

## 客戶端技術

> 此處客戶端是以平台開發者為視角，使用此平台進行網頁開發者為客戶端

- 模板：html、ejs
- 腳本：js、ts
- 樣式：css

客戶端可透過 plugin 引入其他技術，如 TailwindCSS、SCSS 等。

## 如何在此倉庫工作（重要）

- 工作範疇：本檔案的指引適用於整個倉庫（root）。
- 執行環境：Nx 21 + Vite 7，Node 18+ 建議。Vite 多頁透過 `vite-plugin-virtual-mpa`。
- 專案型式：Monorepo，站點位於 `sites/*`，核心功能位於 `.core/*`。

## 目錄結構與重點

- `sites/site-dev`：範例站點（建置與本地開發請以此為參考）
- `.core/vite`：自製 Nx Executor（目標名：`vite`），整合 dev/build/preview 與客製插件
- `.core/assets`：平台共用前端資產（語言轉向頁、控制器腳本等）
- `.core/utils/*`：Node/Browser 工具與打包輔助
- `.core/types`：型別定義（SiteOptions、Page、ViteExecutorSchema…）
- `executors.json`：宣告 `@landing-page-sdk/source:vite` 的 executor 入口

## 開發與執行方式（Nx Targets）

- 開發伺服器（dev）
  - 指令：`npx nx run @sites/site-dev:dev [--port=5173] [--host]`
  - 效果：啟動 Vite 開發伺服器，開啟第一個頁面的 URL。

- 預覽（preview）
  - 指令：`npx nx run @sites/site-dev:preview [--port=4173] [--host]`
  - 效果：啟動 Vite 預覽伺服器以檢視 `dist`。

- 編譯（build）
  - 指令：`npx nx run @sites/site-dev:build`。
  - 目前狀態：僅輸出 sitemap（核心 build、public 搬運與多站點清理在程式中已備妥但預設註解；詳見 `.core/vite/executor/index.ts:77` 起）。

- 通用執行參數（依 `.core/vite/schema.json:1`）
  - `mode`: `dev` | `build` | `preview`
  - `cwd`: 站點根目錄（例：`{projectRoot}`）
  - `host`: 布林或字串，用於 dev/preview 伺服器
  - `port`: 數字，用於 dev/preview 伺服器
  - `config`: 站點設定檔路徑（預設 `site.config.js`）
  - `sites`: 僅生成特定站點（以逗號分隔）
  - `minify`, `versioning`, `assets`: 覆寫對應的 `SiteOptions`（見下）

## 站點專案結構與命名規範

- 預設來源路徑（可由 `site.config.js` 調整，見 `.core/types/lib/vite.d.ts:74`）
  - `src/pages/**/index.html|ejs`：頁面模板；同資料夾下可選 `main.js` 為入口腳本
  - `src/components/*`：EJS 可用的元件（於模板中以 `<%- include($cmp('name'), _data) %>` 引用）
  - `src/i18n/*.json`：語系包（檔名即語代碼，如 `en.json`、`zh-TW.json`）
  - `src/sites/*.js`：多站點腳本（輸出時按站點分目錄）
  - `public/**`：靜態資源（建置時搬運至輸出根或各站點根）

- 頁面路由與檔名（`.core/vite/executor/lib/pages.ts:19`）
  - `routeMode: 'tree'`（預設）：輸出維持樹狀，語系在前。例如：`/en/about/me/index.html`
  - `routeMode: 'flat'`：所有頁面輸出在根，檔名為 `path_lang.html`，例：`about_me_en.html`

- 語系處理（`.core/vite/executor/lib/pages.ts:63`）
  - 有多語或 `routeMode='flat'` 時自動建立根語言轉向頁 `index.html`
  - `enableStubRedirect: true` 時，非 index 的路由也會生成 stub 轉向頁
  - 模板可用變數：`lang`、`langs`、`i18n`、`filename`（全部封裝於 `_data`）

- 多站點（`.core/vite/executor/lib/pages.ts:117`）
  - `src/sites/*.js` 會成為站點腳本；輸出目錄加上站點前綴（如：`site-a/en/...`）
  - 頁面入口（`main.js`）會自動注入對應站點腳本（`.core/vite/executor/lib/plugins/sites-injector.ts:1`）
  - 以 CLI `--sites=site-a,site-b` 可限定輸出站點

## 站點設定（site.config.js）

- 型別：`SiteOptions`（見 `.core/types/lib/vite.d.ts:53` 起）
- 常用屬性與範例（`sites/site-dev/site.config.js:1`）
  - `routeMode: 'tree' | 'flat'`
  - `enableStubRedirect: boolean`
  - `assets: 'abs' | 'rel'`（僅 build: 路徑轉換適用於 HTML/CSS，JS 僅於 `/` 與 `./` 間互換；見 `.core/vite/executor/lib/plugins/render-built-url.ts:1`）
  - `env: { defaultLang: 'zh-TW', ... }`（以 `import.meta.env.KEY` 注入；見 `.core/vite/executor/index.ts:35`）
  - `threshold: number`（多媒體資產大小警示，Byte；見 `.core/vite/executor/lib/public-porter.ts:1`）
  - `transformRedirect(page)`：可操控語言轉向頁的 DOM（JSDOM 環境；見 `.core/vite/executor/lib/plugins/transform-redirect.ts:1`）
  - `controller`：控制器注入（bundle 或 inline）；詳見 `.core/vite/executor/lib/plugins/auto-controller.ts:1`
  - `sitemap: string | { baseUrl, enable, exclude, defaults }`（見 `.core/vite/executor/lib/sitemap-generator.ts:1`）
  - 進階：`versioning: 'hard' | 'soft'`、`minify: boolean | 'html'|'js'|'css' | [...]`（build 僅在啟用對應插件時生效）

範例（精簡）：

```
/** @type {import('@landing-page-sdk/types').SiteOptions} */
export default {
  routeMode: 'tree',
  enableStubRedirect: true,
  assets: 'rel',
  env: { defaultLang: 'zh-TW' },
  threshold: 5 * 1024,
  transformRedirect() {
    const title = this.document.createElement('title');
    title.textContent = 'Redirecting...';
    this.document.head.append(title);
  },
  controller: {
    name: 'mount-download-urls.ts',
    targets: { routes: '/', lang: 'zh-TW', site: 'site-a' },
    injection: 'inline',
  },
  sitemap: 'https://www.example.com',
};
```

## 模板與元件（EJS）

- 頁面模板命名固定為 `index.html` 或 `index.ejs`（會被掃描；見 `.core/vite/executor/lib/common.ts:16`）
- 於模板中引用元件：`<%- include($cmp('logo'), _data) %>`
- 可用 EJS 資料：
  - `_data`：頁面資料快照（同時提供 `_data._data` 以防遮蔽）
  - 常用鍵：`filename`、`lang`、`langs`、`i18n`、`site`、`alias`

## 語言轉向頁（redirect / stub）

- 根轉向頁：依瀏覽器/URL/Cookie 偵測語系（`.core/utils/browser/src/lang.ts:1`），轉向至對應語系
- `routeMode='flat'` 時會轉向至 `index_lang.html`（`.core/assets/redirect/flat.ts:1`）
- `routeMode='tree'` 時會轉向至 `/<lang>/...`（`.core/assets/redirect/tree.ts:1`、`stub.ts:1`）

## Sitemap 輸出

- 啟用條件：`site.config.js` 設定 `sitemap`
- 單語或 `flat`：每站輸出一份 `sitemap.xml`（`.core/vite/executor/lib/sitemap-generator.ts:56`）
- 多語 `tree`：每站輸出多卷與 `sitemapindex.xml`（`.core/vite/executor/lib/sitemap-generator.ts:87`）
- `exclude` 支援字串或 RegExp；`baseUrl` 可為字串或各站點映射

## Build 行為與限制（目前狀態）

- 已接上但預設關閉的階段（可參考並逐步開啟）：
  - Rollup 建置：`build(userConfig)`（`.core/vite/executor/index.ts:69` 註解）
  - 多站點輸出整理：`build-helper`（`.core/vite/executor/lib/build-helper.ts:1`）
  - Public 搬運與資產大小警示：`public-porter`（`.core/vite/executor/lib/public-porter.ts:1`）
  - 資產路徑/版本化轉換：`render-built-url`（僅 build 模式；`.core/vite/executor/lib/plugins/render-built-url.ts:1`）

- 已啟用：Sitemap 生成（build 後執行，`.core/vite/executor/index.ts:72`）

## 開發者須知與慣例

- `@` 別名指向站點 `src`（`.core/vite/executor/index.ts:33`）
- 入口 `main.js` 非必需；若存在會被當作該頁入口
- 隱藏檔（以 `.` 開頭）不會被 i18n 掃描（`.core/vite/executor/lib/pages.ts:83`）
- `import.meta.env` 注入：語系清單（`langs`）與 `site.config.js.env` 內容（`.core/vite/executor/index.ts:35`）
- 站點腳本不注入於 redirect/stub 頁（`.core/vite/executor/lib/pages.ts:205`）

## 常見操作

- 建新頁：於 `src/pages/任意/結構/index.html|ejs` 建檔，必要時加 `main.js`
- 建新語系：於 `src/i18n/` 新增 `xx.json`，模板自帶 `lang/langs/i18n` 可直接使用
- 建新站：於 `src/sites/` 新增 `site-x.js`，build/preview 會輸出於 `dist/site-x/`
- 僅產部分站：加上 `--sites=site-a,site-b`

## 待辦與風險

- build 階段預設未開啟（需逐步啟用與驗證）
- import cache 在 watch reload（`.core/vite/index.ts`）仍採 workaround，之後可改進
- 文件仍在演進；如遇缺項，請更新本檔並附來源檔案路徑
