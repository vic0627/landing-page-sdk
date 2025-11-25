import { $all } from './dom';

/**
 * 從指定的 URL 中提取查詢字串部分。
 *
 * @param url - 要解析的 URL，預設為當前頁面的 URL。
 * @returns 返回 URL 中的查詢字串部分，如果 URL 中不包含查詢字串，則返回空字串。
 */
export function getQueryString(url = window.location.href) {
  const queryStringStart = url.indexOf('?');
  return queryStringStart !== -1 ? url.substring(queryStringStart + 1) : '';
}

/**
 * 取得 URL 中指定名稱的查詢參數值。
 *
 * @param paramName - 查詢參數名稱。
 * @param url - 要解析的 URL，預設為當前頁面的 URL。
 * @returns 返回查詢參數的值，如果未找到則返回 null。
 */
export function getQueryParam(
  paramName: string,
  url: string = window.location.href
): string | null {
  const queryParams = parseQueryParams(url);

  if (queryParams) return queryParams[paramName] ?? null;

  return null;
}

/**
 * 新增或更新 URL 中的指定查詢參數。
 *
 * @param paramName - 查詢參數名稱。
 * @param paramValue - 查詢參數值。
 * @param url - 要修改的 URL，預設為當前頁面的 URL。
 * @returns 返回包含更新後查詢字串的 URL。
 */
export function setQueryParam(
  paramName: string,
  paramValue: string,
  url: string = window.location.href
): string {
  const queryParams = parseQueryParams(url);

  if (!queryParams) return url;

  queryParams[paramName] = paramValue;

  const queryString = buildQueryString(queryParams);

  if (!queryString) return url;

  return clearQueryParams(url) + '?' + queryString;
}

/**
 * 刪除 URL 中的指定查詢參數。
 *
 * @param paramName - 要刪除的查詢參數名稱。
 * @param url - 要修改的 URL，預設為當前頁面的 URL。
 * @returns 返回刪除指定查詢參數後的 URL。
 */
export function deleteQueryParam(paramName: string, url: string = window.location.href): string {
  const queryParams = parseQueryParams(url);

  if (!queryParams) return url;

  delete queryParams[paramName];

  const queryString = buildQueryString(queryParams);

  if (!queryString) return url;

  return clearQueryParams(url) + '?' + queryString;
}

/**
 * 解析 URL 中的所有查詢參數並返回一個對象。
 *
 * @param url - 要解析的 URL，預設為當前頁面的 URL。
 * @returns 返回包含所有查詢參數的對象。
 */
export function parseQueryParams(url: string = window.location.href): Record<string, string> {
  const queryString = url.split('?')[1];

  if (!queryString) return {};

  const result = queryString.split('&').reduce((acc, param) => {
    const [key, value] = param.split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  return result;
}

/**
 * 根據傳入的對象生成查詢字串。
 *
 * @param params - 包含查詢參數的對象。
 * @returns 返回生成的查詢字串。
 */
export function buildQueryString(params: Record<string, string>): string {
  const queryString = Object.entries(params).reduce((acc, [key, value], i) => {
    const pair = `${key}=${value}`;
    return !i ? (acc += pair) : (acc += `&${pair}`);
  }, '');

  return queryString;
}

/**
 * 批量更新 URL 中的多個查詢參數。
 *
 * @param params - 要更新的查詢參數的鍵值對對象。
 * @param url - 要修改的 URL，預設為當前頁面的 URL。
 * @returns 返回包含更新後查詢字串的 URL。
 */
export function updateQueryParams(
  params: Record<string, string>,
  url: string = window.location.href
): string {
  const queryParams = parseQueryParams(url);

  if (!queryParams) return url;

  for (const key in params) {
    queryParams[key] = params[key];
  }

  const queryString = buildQueryString(queryParams);

  if (!queryString) return url;

  return clearQueryParams(url) + '?' + queryString;
}

/**
 * 移除 URL 中的所有查詢參數。
 *
 * @param url - 要清除查詢參數的 URL，預設為當前頁面的 URL。
 * @returns 返回清除所有查詢參數後的 URL。
 */
export function clearQueryParams(url: string = window.location.href): string {
  return url.split('?')[0];
}

/**
 * 設定含有 `data-to` 屬性的 `<a>` 的 `data-query` 屬性
 *
 * @description 此方法觸發的副作用僅在路由模式下生效。
 *
 * @param selector - CSS 選擇器
 * @param queryDescriptor 要寫入 data-query 的資料
 */
export function setDataQuery(
  selector: string,
  queryDescriptor: boolean | string[] | Record<string, string | number | boolean>
): void {
  let dataQuery: string;
  if (typeof queryDescriptor === 'boolean') dataQuery = queryDescriptor ? '' : 'false';
  if (typeof queryDescriptor === 'object') dataQuery = JSON.stringify(queryDescriptor);
  $all(selector).forEach((node) => node.setAttribute('data-query', dataQuery));
}
