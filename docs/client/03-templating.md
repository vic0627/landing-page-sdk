# 3. 頁面模板

所有 `.html` 和 `.ejs` 檔案都會被當作 EJS 模板處理，讓您可以在 HTML 中嵌入動態資料和邏輯。

### 模板可用變數

在模板中，您可以直接存取以下常用屬性：

-   `i18n`: 對應當前語系的翻譯物件，來自 `src/i18n/` 的 JSON 檔。
-   `lang`: 當前頁面的語系代碼 (例如 `en`)。
-   `langs`: 專案支援的所有語系列表。
-   `site`: 當前頁面所屬的站點名稱。
-   `alias`: 當前站點的別名。
-   `env`: 來自 `site.config.js` 中 `env` 設定的環境變數。
-   `filename`: 此頁面最終輸出的檔案路徑。

**範例：**
```html
<h1><%= i18n.title %></h1>
<p>目前語系: <%= lang %></p>
<% if (site === 'site-a' && lang === 'en') { %>
  <p>我只會在 en 語系下的 site-a 顯示</p>
<% } %>
```

### 元件系統 (`$cmp`)

為了方便管理與複用，您可以建立可複用的模板片段（例如 `header.ejs`, `footer.ejs`）。

#### 引入元件

在頁面模板中，使用 `$cmp()` 函式來取得元件的絕對路徑，並搭配 EJS 的 `include` 語法來引入元件。`$cmp()` 支援兩種路徑解析方式：

1.  **專案內元件**: 如果路徑不以 `@` 開頭，會自動解析為當前專案的 `src/components/` 目錄。
    ```html
    <%- include($cmp('header.ejs')) %>
    ```

2.  **跨專案元件**: 如果路徑以 `@` 開頭，則會將其視為 monorepo 中的另一個專案路徑來解析。這讓您可以建立一個共用的元件庫。
    ```html
    <%- include($cmp('@landing-page-sdk/assets/components/my-component.ejs')) %>
    ```

#### 傳遞資料 (`_data`)

在 `include` 元件時，建議一併傳入 `_data` 物件：

```html
<body>
  <%- include($cmp('header.ejs'), _data) %>

  <main>
    <!-- Page content -->
  </main>

  <%- include($cmp('footer.ejs'), _data) %>
</body>
```

**為什麼要傳入 `_data`？**

這是為了避免「變數遮蔽 (Variable Shadowing)」。`_data` 是頂層模板資料物件的一個完整參照。如果在您的元件內部不小心宣告了一個與頂層資料屬性同名的變數（例如 `lang`），您依然可以透過 `_data.lang` 來存取到原始的、全域的 `lang` 變數，確保資料來源的明確性與穩定性。