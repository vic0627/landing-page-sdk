/**
 * 返回路徑中的最後一部分。
 *
 * @param path - 完整的文件路徑。
 * @returns 路徑中的最後一部分，即文件名及其擴展名。
 */
export function basename(path: string): string {
  return path.split("/").filter(Boolean).pop() || "";
}

/**
 * 返回路徑中的目錄名。
 *
 * @param path - 完整的文件路徑。
 * @returns 路徑中的目錄部分，排除最後一個斜槓及後面的部分。
 */
export function dirname(path: string): string {
  return path.split("/").slice(0, -1).join("/") || "/";
}

/**
 * 返回路徑中的擴展名。
 *
 * @param path - 完整的文件路徑。
 * @returns 路徑中的文件擴展名，如果沒有擴展名則返回空字串。
 */
export function extname(path: string): string {
  const base = basename(path);
  const dotIndex = base.lastIndexOf(".");
  return dotIndex !== -1 ? base.slice(dotIndex) : "";
}

/**
 * 連接多個路徑片段，並返回規範化後的完整路徑。
 *
 * @param paths - 要連接的多個路徑片段。
 * @returns 返回連接後的完整路徑。
 */
export function join(...paths: string[]): string {
  return paths
    .map((path) => path.replace(/\/+$/, "")) // 去除結尾的斜槓
    .filter(Boolean) // 過濾掉空字串
    .join("/")
    .replace(/\/{2,}/g, "/"); // 替換多個連續的斜槓為單個斜槓
}

/**
 * 規範化路徑，解析 '.' 和 '..' 並刪除多餘的斜槓。
 *
 * @param path - 要規範化的路徑。
 * @returns 返回規範化後的路徑。
 */
export function normalize(path: string): string {
  const segments = path.split("/").filter(Boolean);
  const stack: string[] = [];

  for (const segment of segments) {
    if (segment === "..") {
      stack.pop();
    } else if (segment !== ".") {
      stack.push(segment);
    }
  }

  return "/" + stack.join("/");
}

/**
 * 確定 path 是否為絕對路徑。
 *
 * @param path - 要測試的路徑。
 * @returns 如果 path 為絕對路徑，則返回 true，否則返回 false。
 */
export function isAbsolute(path: string): boolean {
  return path.startsWith("/");
}

/**
 * 解析路徑為絕對路徑。
 *
 * @param path - 要解析的路徑。
 * @returns 返回解析後的絕對路徑。
 */
export function resolve(...paths: string[]): string {
  let resolvedPath = "";
  for (let i = paths.length - 1; i >= 0; i--) {
    const segment = paths[i];
    if (segment.startsWith("/")) {
      resolvedPath = segment + "/" + resolvedPath;
      break;
    } else if (segment) {
      resolvedPath = segment + "/" + resolvedPath;
    }
  }
  return normalize("/" + resolvedPath);
}

/**
 * 根據開發或生產版本解析靜態資源的動態路徑
 *
 * @param path - 要依環境動態改變的路徑，可為相對路徑（限定指向同層）或絕對路徑，但必須是指向 assets 的路徑。
 * @returns 返回解析後的動態路徑，開發模式下為絕對路徑，構建生產版本時為相對路徑。
 *
 * @example
 * dynamicAssetsPath("assets/images/logo.png");
 * dynamicAssetsPath("/assets/images/logo.png");
 * dynamicAssetsPath("./assets/images/logo.png");
 * // 以上三種輸出結果皆相同
 * // dev => "/assets/images/logo.png"
 * // build => "./assets/images/logo.png"
 *
 * @example
 * // 錯誤路徑
 * dynamicAssetsPath("../assets/images/logo.png");
 * dynamicAssetsPath("../public/assets/images/logo.png");
 * dynamicAssetsPath("/public/assets/images/logo.png");
 */
export function dynamicAssetsPath(path: string): string {
  const isDev = import.meta.env.DEV;

  const isValidPath = /^(\/|\.\/)?assets\//.test(path);
  if (!isValidPath) {
    throw new Error("路徑必須指向 assets 目錄，且不能是上層路徑或指向其他目錄");
  }

  if (isDev) {
    return path.startsWith("/") ? path : `/${path.replace(/^\.\/?/, "")}`;
  }

  return path.startsWith("./") ? path : `./${path.replace(/^\//, "")}`;
}
