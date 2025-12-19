# 從「一倉多頁」的混沌到「一套 SDK」

在做行銷或活動頁時，最痛的常是「一倉塞滿多頁、多個子 repo」：每個站點、語系、變體都要各寫一份 gulpfile、各配一次流程，彼此獨立又重複。這份 Landing Page SDK 想把這件事變成「一套平台」：同一個倉庫、同一份配置，就能同時產出多站點、多語系、多版本的頁面，開發體驗像平時寫前端一樣順暢，build 也保持 Vite 的速度。

這篇分享會帶你用實戰的節奏跑一遍，同時拆解背後的設計亮點。希望讀完之後，你不只會用，也能把其中的做法帶回自己的專案。

## 現場長什麼樣
- 前線多半是設計/美術同事，他們能寫 HTML/CSS/JS（含 SCSS 或 Tailwind），但不想面對複雜的 build pipeline。
- 發布方式通常是「打包好直接丟上 server」，不會額外設定 fallback、rewrites 等伺服器行為。
- 舊專案常是「一倉多頁」：同一倉庫塞滿一堆子 repo/子資料夾，各自帶著 gulpfile、設定彼此獨立，幾乎沒共享。
- 不同活動類型會臨時要求加 GTM、tracking 或自訂腳本，愈堆愈亂。
- 同一個站點還會有多個變體：版面改、文案改，甚至功能也不同（例如表單欄位或追蹤邏輯）。

## 這篇想解決的痛點
- 多品牌/多語系需要「一鍵多輸出」，而不是手動複製頁面。
- 路由、redirect、sitemap、資產路徑等重複瑣事應該自動化。
- 修改配置或文案時要有可靠的 HMR 重載，不必重啟工具鏈。
- 架構要能插拔：想接自己的 mock、控制器或模板，都要容易。

## 我們做了什麼（快照）
- Nx executor + Vite：自訂執行器負責載入/正規化 site.config，並提供 HMR 風格的重跑流程。
- Pages pipeline：掃描模板 → 本地化 → 多站點變體，產出 route/redirect manifest。
- 插件群：router-link、sites-injector、page-context、virtual-assets、render-built-url、mock 等把「跨站/跨語系」的細節封裝起來。
- Post-build：site distributor、public porter、sitemap generator 讓輸出可直接部署。
- 腳手架模板：一條指令生成 Vue/React/無框架的站點骨架，含 i18n、樣式選項。

## 接下來你會看到什麼
1. 架構鳥瞰：Nx executor 與 Vite 插件如何協作，流程長什麼樣。
2. 一次跑通：從新專案到 dev/build/preview 的實戰流程。
3. 亮點拆解：路由與 redirect 策略、page-context 注入、virtual-assets、mock、HMR/Watcher 設計。
4. 輸出與部署：多站點/多語系輸出、版本化策略、sitemap、自動資產搬運。
5. 腳手架與客製：模板、控制器注入模式、如何插拔自家組件與 mock。

準備好了就往下翻，從架構鳥瞰開始。
