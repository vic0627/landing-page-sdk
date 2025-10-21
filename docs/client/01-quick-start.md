# 1. 快速上手

### 建立新站點

開始一個新專案最快的方式是使用內建的程式碼產生器：

```bash
npx nx generate @landing-page-sdk/plugins:template
```

執行後，系統會引導您輸入專案名稱、路徑等資訊，然後在 `sites/` 目錄下建立一個包含完整基礎結構的新站點，新站點將會以 `@sites/` 為命名空間，假設建立新站點輸入的名稱為 `new-site`，那麼完整的站點名稱將會是 `@sites/new-site`。

### 目錄結構

一個站點通常包含以下結構：

```
/sites/your-site-name/
|-- package.json       # 專案的基本資訊
|-- site.config.js     # 專案的核心設定檔
|-- public/
|   |-- __ASSETS__/    # 靜態資源 (圖片、favicon 等)
|-- src/
    |-- components/    # 可複用的 EJS 元件
    |-- i18n/          # 多國語系 JSON 檔案
    |-- pages/         # 頁面模板與邏輯
    |-- sites/         # 站點變體腳本
    |-- styles/        # 共用樣式
```

### 常用指令

專案範本內建了 `dev`、`build` 和 `preview` 三個指令，可透過 Nx 執行。

#### 開發

執行以下指令來啟動開發伺服器：

```bash
# 將 your-site-name 替換成您的站點名稱
npx nx dev @sites/your-site-name
```

伺服器將會啟動，並提供一個可供預覽的網址，支援熱模組更換 (HMR)。

**可用選項：**

-   `--host`: 指定伺服器綁定的網路介面 (例如: `--host`)。
-   `--port`: 指定伺服器埠號 (例如: `--port=8080`)。
-   `--sites`: 指定要同時開發或建置的站點變體，以逗號分隔 (例如: `--sites=site-a,site-b`)。
-   `--config`: 指定 `site.config.js` 的替代路徑。
-   `--verbose`: 啟用詳細日誌輸出。

#### 建置

執行以下指令來為生產環境建置站點：

```bash
npx nx build @sites/your-site-name
```

建置完成的檔案會輸出到 `dist/` 目錄。

**可用選項：**

-   `--sites`: 指定要建置的站點變體。
-   `--config`: 指定 `site.config.js` 的替代路徑。
-   `--verbose`: 啟用詳細日誌輸出。

#### 預覽

在本地預覽生產環境建置後的結果：

```bash
npx nx preview @sites/your-site-name
```

**可用選項：**

-   `--host`: 指定伺服器綁定的網路介面。
-   `--port`: 指定伺服器埠號。
-   `--sites`: 指定要預覽的站點變體。
-   `--config`: 指定 `site.config.js` 的替代路徑。
-   `--verbose`: 啟用詳細日誌輸出。
