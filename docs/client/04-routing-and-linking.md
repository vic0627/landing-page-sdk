# 4. 路由與連結

### 路由設定 (`route`)

您可以在 `site.config.js` 中設定 `route.mode` 來決定網站的 URL 結構：

-   `mode: 'tree'` (預設): 樹狀結構，URL 會反映您的 `src/pages` 目錄結構，並包含語系前綴。例如：`/en/about/me/`。
-   `mode: 'flat'`: 扁平結構，所有頁面都會被輸出到根目錄，並以 `路徑_語系.html` 的方式命名。例如：`about_me_en.html`。

### 站內連結 (`data-to`)

為了讓連結在不同的路由模式下都能正常運作，請**務必**使用 `data-to` 屬性來建立站內連結。

```html
<!-- 基本連結 -->
<a data-to="/about/me">關於我</a>

<!-- 連結到不同語系 -->
<a data-to="/about/me" data-locale="ja">日本語版</a>
```

SDK 會在建置時自動將 `data-to` 轉換為正確的 `href` 路徑。
