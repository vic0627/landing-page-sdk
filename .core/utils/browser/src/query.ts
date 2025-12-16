import {
  buildQueryString as buildQueryStringString,
  clearQueryParams as clearQueryParamsString,
  deleteQueryParam as deleteQueryParamString,
  getQueryString as getQueryStringString,
  parseQueryParams as parseQueryParamsString,
  setQueryParam as setQueryParamString,
  updateQueryParams as updateQueryParamsString,
} from '@landing-page-sdk/utils-node/src/query';
import { $all } from './dom';

export function getQueryString(url = window.location.href) {
  return getQueryStringString(url);
}

export function getQueryParam(
  paramName: string,
  url: string = window.location.href
): string | null {
  const queryParams = parseQueryParams(url);
  return queryParams[paramName] ?? null;
}

export function setQueryParam(paramName: string, paramValue: string, url: string = window.location.href) {
  return setQueryParamString(paramName, paramValue, url);
}

export function deleteQueryParam(paramName: string, url: string = window.location.href): string {
  return deleteQueryParamString(paramName, url);
}

export function parseQueryParams(url: string = window.location.href): Record<string, string> {
  return parseQueryParamsString(url);
}

export function buildQueryString(params: Record<string, string>): string {
  return buildQueryStringString(params);
}

export function updateQueryParams(params: Record<string, string>, url: string = window.location.href): string {
  return updateQueryParamsString(params, url);
}

export function clearQueryParams(url: string = window.location.href): string {
  return clearQueryParamsString(url);
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
