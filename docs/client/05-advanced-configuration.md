# 5. 進階設定

`site.config.js` 提供了豐富的設定選項，讓您可以深度客製化建置行為。本章節將深入探討各項主要設定的使用方式與範例。

---

### 輸出設定 (`output`)

此選項控制建置產物的格式、壓縮行為和資源路徑。

```javascript
// site.config.js
export default {
  output: {
    // ...
  },
};
```

**屬性說明：**

-   `minify`: 控制程式碼壓縮。
    -   `true` (預設): 壓縮所有資源 (HTML, JS, CSS)。
    -   `false`: 不進行任何壓縮。
    -   `'js'` 或 `['js', 'css']`: 只壓縮指定的資源類型。

-   `versioning`: 控制資源版本號的附加方式。
    -   `'hard'` (預設): 將雜湊值直接寫入檔名，例如 `main-a1b2c3d4.js`。利於 CDN 長期快取。
    -   `'soft'`: 檔名不變，將雜湊值作為查詢參數，例如 `main.js?v=a1b2c3d4`。

-   `assetsResolution`: 控制 HTML 中資源 URL 的路徑解析方式。
    -   `'abs'` (預設): 使用絕對路徑，例如 `/assets/image.png`。
    -   `'rel'`: 使用相對路徑。對於深層頁面（如 `/about/me/`），路徑會被轉換為 `../../assets/image.png`。

-   `threshold`: 資源大小警告閾值（單位：Byte）。當建置過程中發現有資源超過此大小，會在主控台顯示警告，幫助您控管頁面效能。

---

### 自動轉向 (`redirect`)

此功能用於在多國語系網站中，自動偵測使用者語系並將其導向正確的頁面。

**屬性說明：**

-   `enable`: `boolean` (預設 `true`)。
    -   設為 `true` 時，若專案為多國語系，會在網站根目錄 `/` 產生一個轉向頁，自動將使用者導向其瀏覽器對應的語系首頁（例如 `/en/`）。

-   `stub`: `boolean` (預設 `false`)。
    -   設為 `true` 時，會為所有不帶語系前綴的頁面路徑（例如 `/about/me`）都產生一個轉向頁，確保使用者即使手動輸入無語系網址，也能被正確導向（例如 `/en/about/me`）。

-   `defaultLang`: `string`。
    -   設定一個預設的轉向語系。當無法從瀏覽器設定中偵測到符合的語系時，將會使用此處設定的語言作為備案。

-   `transform`: `(this: DOMWindow, page: Page) => void`。
    -   一個高階函式，允許您在轉向頁產生前，直接操作該頁面的 DOM。`this` 會是 JSDOM 的 `window` 物件。這對於插入追蹤碼、修改 `<meta>` 標籤等場景非常有用。

**範例：**
```javascript
// site.config.js
export default {
  redirect: {
    enable: true,
    stub: true,
    defaultLang: 'en',
    transform(page) {
      // this === JSDOM window object
      const title = this.document.createElement('title');
      title.textContent = 'Redirecting...';
      this.document.head.appendChild(title);
    },
  },
};
```

---

### Sitemap 產生 (`sitemap`)

自動產生 `sitemap.xml` 和 `sitemap_index.xml`（多語系時）。

**基礎用法：**

最簡單的啟用方式是直接提供網站的 `baseUrl`。

```javascript
// site.config.js
export default {
  sitemap: 'https://your-domain.com',
};
```

**進階設定：**

若需更精細的控制，可以傳入一個物件。

```javascript
// site.config.js
export default {
  sitemap: {
    enable: true,
    baseUrl: {
      default: 'https://default-site.com', // 預設 baseUrl
      'site-b': 'https://site-b.com', // 為名為 'site-b' 的站點指定 baseUrl
    },
    orientation: 'dir', // URL 使用目錄形式 (例如 /about/)，預設為 'file'
    exclude: ['/private/**'], // 排除特定路徑
    defaults: { // sitemap 條目的預設值
      changefreq: 'daily',
      priority: 0.7,
    },
    useAliasAsPath: false, // URL 路徑中不使用站點別名
  },
};
```

---

### 控制器 (`controller`)

控制器是一個強大的功能，允許您將共用腳本邏輯注入到符合條件的特定頁面中。

**基礎用法：**

```javascript
// site.config.js
export default {
  controller: {
    name: 'my-logic.ts', // 對應 @landing-page-sdk/assets/controller/my-logic.ts
    targets: '/some-page', // 指定注入到 /some-page 這個路由
  },
};
```

**設定多個控制器**

若您需要為不同頁面或在相同頁面注入多個不同的控制器，可以將 `controller` 設定為一個陣列：

```javascript
// site.config.js
export default {
  controller: [
    {
      name: 'google-analytics',
      targets: [], // 注入到所有頁面
      injection: { type: 'inline', placement: 'pre' }
    },
    {
      name: 'product-page-logic',
      targets: '/product', // 只注入到產品頁
    }
  ]
};
```

**進階目標設定 (`targets`)**

`targets` 可以是一個物件，用來更精準地鎖定注入目標，系統會取各項設定的「交集」。

```javascript
// site.config.js
export default {
  controller: {
    name: 'my-logic.ts',
    targets: {
      routes: ['/page1', '/page2'], // 注入到 /page1 和 /page2
      lang: ['en'], // 且語系必須是 en
      site: ['site-a'], // 且站點必須是 site-a
    },
  },
};
```

**進階注入設定 (`injection`)**

`injection` 控制腳本的注入方式。

```javascript
// site.config.js
export default {
  controller: {
    name: 'my-logic.ts',
    targets: '/some-page',
    injection: {
      type: 'inline', // 'inline': 直接內嵌到 HTML; 'bundle': 打包進 JS (預設)
      placement: 'pre', // 'pre': 在頁面原有腳本前注入; 'post': 在之後注入 (預設)
      appendTo: 'body', // `type: 'inline'` 時生效，注入到 `<body>` (預設 'head')
      bundle: false, // `type: 'inline'` 時生效，注入前不對腳本進行打包 (預設 true)
    },
  },
};
```

---

### API 模擬 (`mock`)

開發時，您可以啟用 API Mocking 功能，由 `vite-plugin-mock` 提供支援。

-   **預設行為**: 自動讀取 `@landing-page-sdk/assets/mock` 目錄下的 mock 檔案。
-   **停用功能**: `mock: false`。
-   **指定自訂目錄**: `mock: 'src/my-mocks'`。

```javascript
// site.config.js
export default {
  // 使用自訂的 mock 檔案目錄
  mock: 'src/mocks',
  // 使用別的專案的 mock 檔案目錄
  mock: '@sites/project-a/mocks',
};
```

---

### 環境變數 (`env`)

您可以在 `env` 物件中定義的任何變數，都會被注入到前端環境中。

```javascript
// site.config.js
export default {
  env: {
    API_ENDPOINT: 'https://api.example.com',
    FEATURE_FLAG_A: true,
  },
};
```

-   **在 JavaScript 中存取**: `import.meta.env.API_ENDPOINT`
-   **在 EJS 模板中存取**: `<%%= env.API_ENDPOINT %>`