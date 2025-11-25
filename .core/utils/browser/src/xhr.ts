import { buildQueryString } from './query';

interface XhrInit {
  /**
   * 請求的 URL。
   */
  url: string;
  /**
   * 請求的 body，適用於 POST 等需要 body 的請求方法。
   */
  body?: XMLHttpRequestBodyInit | null;
  /**
   * HTTP 方法，默認為 "GET"。
   * @default "GET"
   */
  method?: string;
  /**
   * 請求頭設定的鍵值對。
   */
  headers?: Record<string, string>;
  /**
   * 請求的查詢參數，會附加在 URL 後方。
   */
  query?: Record<string, string>;
}

const autoJsonResponse = (xhr: XMLHttpRequest) =>
  xhr.responseType === 'json' ? JSON.parse(xhr.responseText) : xhr.responseText;

/**
 * 發送 AJAX 請求的通用函數，支援 GET、POST 等 HTTP 方法。
 *
 * 此函數使用 `XMLHttpRequest` 發送 HTTP 請求並回傳一個 `Promise`，當請求成功時解析並返回 JSON 或原始文字回應，若請求失敗則返回錯誤。
 *
 * @template D - 指定回應數據的類型。
 *
 * @param xhrInit - 包含請求初始化配置的物件。
 *
 * @returns 返回一個 `Promise`，當請求成功時解析並返回伺服器回應的數據，當請求失敗時返回錯誤。
 *
 * @example
 * // 發送一個 GET 請求
 * ajax<{ name: string }>({
 *   url: "https://api.example.com/user",
 *   query: { id: "123" },
 * }).then((response) => {
 *   console.log(response.name); // 輸出回應的 name 屬性
 * }).catch((error) => {
 *   console.error("Request failed", error);
 * });
 *
 * @example
 * // 發送一個 POST 請求
 * ajax({
 *   url: "https://api.example.com/user",
 *   method: "POST",
 *   headers: {
 *     "Content-Type": "application/json",
 *   },
 *   body: { name: "John Doe" },
 * }).then((response) => {
 *   console.log("User created", response);
 * }).catch((error) => {
 *   console.error("Request failed", error);
 * });
 */
export function ajax<D>(xhrInit: XhrInit): Promise<D> {
  return new Promise((resolve, reject) => {
    const { method = 'GET', headers = {}, body = null, query } = xhrInit;
    let { url } = xhrInit;
    const xhr = new XMLHttpRequest();
    if (query) url += `?${buildQueryString(query)}`;
    xhr.open(method, url);
    for (const key in headers) xhr.setRequestHeader(key, headers[key]);
    xhr.onload = () => {
      const { status } = xhr;
      const res = autoJsonResponse(xhr);
      status >= 200 && status < 300 ? resolve(res) : reject(res);
    };
    xhr.onerror = () => reject(autoJsonResponse(xhr));
    const isJson = headers['Content-Type'] === 'application/json';
    xhr.send(isJson ? JSON.stringify(body) : body);
  });
}
