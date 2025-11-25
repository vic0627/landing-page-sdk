<h1 align="center">
Landing Page SDK
</h1>

<p align="center">
  一個強大、由 Vite 驅動的 SDK，用於建構和管理高效能的登陸頁面。
</p>

---

## 文件

-   [平台使用者文件](./docs/client/README.md)
-   [平台開發者文件](./docs/dev/README.md)

## 功能特色

-   ⚡️ **Vite 驅動：** 享受閃電般的開發體驗，包含即時啟動的伺服器和熱模組更換 (HMR)。
-   🏗️ **多站點架構：** 在單一程式碼庫中管理多個品牌或活動的登陸頁面 (LP)。
-   📄 **多頁面應用 (MPA)：** 內建支援建構傳統的多頁面應用程式。
-   🎭 **站點變體：** 針對單一登陸頁面，可根據不同設定或目標受眾，產生多種輸出版本。
-   🚀 **互動式腳手架：** 提供互動式指令，可快速生成新站點的完整架構。
-   💉 **自動化腳本注入：** 自動將必要的腳本和樣式注入頁面，無需手動管理。
-   📦 **優化建置：** 為每個站點自動打包必要的資源，確保最小的打包體積和更快的載入時間。
-   🔧 **簡易設定：** 透過簡單的 JavaScript 設定檔，輕鬆設定站點、頁面和重新導向。
-   🌍 **國際化 (i18n)：** 內建支援多語言內容本地化。
-   🔌 **可擴充核心：** 靈活的插件和執行器系統，允許自訂擴充和整合。

## 專案結構

此儲存庫是透過 Nx monorepo 進行管理。

```
.
├── .core/         # 核心 SDK 邏輯、Vite 插件和工具程式
├── .nx/           # Nx 快取目錄
├── dist/          # 建置輸出目錄
├── docs/          # 文件目錄
├── nx.json        # Nx 工作區設定
└── package.json   # 套件設定檔
```

## 如何開始

### 環境需求

-   [Node.js](https://nodejs.org/) (建議使用 LTS 版本)

### 安裝

1.  複製此儲存庫。

2.  在專案根目錄安裝依賴：
    ```bash
    npm install
    ```

### 建立新站點

本專案提供了一個程式碼產生器，可以快速建立一個新的站點。

執行以下指令來啟動產生器：

```bash
npx nx g @landing-page-sdk/plugins:template
```

執行後，系統會提示您輸入以下資訊：
-   **專案名稱 (name):** 新站點的名稱 (例如: `my-new-site`)。
-   **專案路徑 (path):** 新站點的路徑 (例如: `landing-page/my-new-site`)。
-   **路由模式 (routeMode):** 站點要使用的路由模式 (`tree` 或 `flat`)。
-   **使用 TypeScript (useTs):** 是否使用 TypeScript (是/否)。
-   **框架 (framework):** 站點要使用的框架 (`vue`、`react` 或 `none`)。
-   **樣式處理器 (style):** 站點要使用的樣式處理器 (`tailwindcss`、`sass` 或 `none`)。

完成後，新的站點 `my-new-site` 將會被建立在 `landing-page/my-new-site` 目錄下，並包含所有必要的設定檔和基礎範例頁面。

### 為子專案安裝套件

若要為特定站點（子專案）安裝額外套件，請在**專案根目錄**使用 `npm install` 並搭配 `--workspace` 參數。

```bash
npm install <package-name> --workspace=@sites/<project-name>
```

**重要：** 嚴禁在子專案目錄下直接執行 `npm install`，這會導致套件被錯誤地安裝到根目錄的 `package.json` 中，進而影響整個 monorepo 的穩定性。

### 開發模式

若要為特定站點啟動開發伺服器，請使用 `nx dev` 指令。例如，啟動 `my-new-site` 專案：

```bash
npx nx dev my-new-site
```

伺服器將會啟動，您可以在瀏覽器中看到您的網站，並享受即時重新載入的功能。

### 生產環境建置

若要為生產環境建置站點，請使用 `nx build` 指令：

```bash
npx nx build my-new-site
```

經過優化和打包的資源將會被放置在 `dist` 目錄中。

## 授權

本專案採用 MIT 授權。
