# 2. 核心概念

### 專案設定 (`site.config.{js,ts}`)

`site.config.{js,ts}` 是您專案的控制中心。幾乎所有的 SDK 功能都是透過這個檔案進行設定，包含路由模式、輸出行為、多國語系轉向、Sitemap 等。詳細的設定選項將在後續章節說明。

### 頁面

頁面是您網站的基礎。您可以在 `src/pages/` 目錄下建立頁面。每一個頁面由一個目錄構成，其中包含：

-   `index.{html,ejs}`：頁面的 HTML 結構與模板。
-   `main.{js,ts,jsx,tsx}`：該頁面的主要 JavaScript 進入點。

目錄的結構會直接對應到網站的路由。例如，`src/pages/about/me/` 會對應到 `/about/me` 這個網址。

> **虛擬入口（Virtual Entry）：** 若某個頁面目錄下沒有 `main.{js,ts,jsx,tsx}`，SDK 會自動向上查找並使用 `src/pages/main.{js,ts,jsx,tsx}` 作為該頁面的入口。這讓您可以為所有頁面共用同一個進入點邏輯（例如 SPA 架構），而無需在每個頁面目錄重複建立檔案。

### 多站點

本 SDK 支援在一個程式碼庫中管理多個站點。您可以在 `src/sites/` 目錄下建立不同的站點腳本，例如 `site-a.js`，SDK 將會以檔案名稱（`site-a`）作為站點名稱，並在開發環境時作為衍伸的 URL 路徑。

假設有 `/about/me` 這個頁面，若在 `src/sites/` 目錄下建立了 `site-a.js`，則該頁面在開發環境時的 URL 將會是 `/site-a/about/me`。

當站點腳本被建立後，將會啟用以下幾種機制：

-   當您訪問了特定站點，對應的站點腳本將會被自動注入，讓您可以執行該站點特有的邏輯。
-   可以在模板中透過 `site` 來存取站點名稱。
    ```html
    <% if (site === 'site-a') { %>
    <h1>Site A</h1>
    <% } %>
    ```
-   可以在 JavaScript 中透過全域變數 `__SDK_PAGE_CTX__.data.site` 來存取站點名稱。
    ```js
    const { site } = __SDK_PAGE_CTX__.data;
    console.log(site);
    ```

透過以上機制，您可以在同一網站下進行多版本的平行開發。

### 國際化

若要啟用多國語系功能，只需在 `src/i18n/` 目錄下新增對應的語言 JSON 檔即可。

-   SDK 會自動偵測這些語言檔，並在建置時為每個語言產生對應的頁面。
-   在模板中，您可以透過 `i18n` 物件來存取翻譯字串。
    ```html
    <h1><%= i18n.title %></h1>
    ```
-   在 JavaScript 中，您也可以透過全域變數 `__SDK_PAGE_CTX__.data.i18n` 物件來存取完整的語言包。
    ```js
    const { i18n } = __SDK_PAGE_CTX__.data;
    const lang = document.documentElement.lang;
    const langPack = i18n[lang];
    console.log(langPack);
    ```