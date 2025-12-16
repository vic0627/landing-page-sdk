type QueryValue = string | number | boolean;

interface SplitUrlResult {
  beforeHash: string;
  hash: string;
}

const splitHash = (url: string): SplitUrlResult => {
  const hashIndex = url.indexOf('#');
  return hashIndex === -1
    ? { beforeHash: url, hash: '' }
    : { beforeHash: url.slice(0, hashIndex), hash: url.slice(hashIndex) };
};

export function getQueryString(url: string) {
  const { beforeHash } = splitHash(url);
  const queryIndex = beforeHash.indexOf('?');
  return queryIndex !== -1 ? beforeHash.substring(queryIndex + 1) : '';
}

export function parseQueryParams(url: string): Record<string, string> {
  const queryString = getQueryString(url);
  if (!queryString) return {};

  return queryString.split('&').reduce((acc, param) => {
    if (!param) return acc;
    const [rawKey, rawValue = ''] = param.split('=');
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rawValue);
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);
}

export function buildQueryString(params: Record<string, QueryValue>): string {
  const entries = Object.entries(params);
  if (!entries.length) return '';

  return entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

export function clearQueryParams(url: string): string {
  const { beforeHash, hash } = splitHash(url);
  const queryIndex = beforeHash.indexOf('?');
  const base = queryIndex === -1 ? beforeHash : beforeHash.slice(0, queryIndex);
  return base + hash;
}

export function setQueryParam(
  paramName: string,
  paramValue: QueryValue,
  url: string
): string {
  const queryParams = parseQueryParams(url);
  queryParams[paramName] = String(paramValue);

  const queryString = buildQueryString(queryParams);
  const { hash } = splitHash(url);
  const base = clearQueryParams(url);

  return queryString ? `${base}?${queryString}${hash}` : base;
}

export function deleteQueryParam(paramName: string, url: string): string {
  const queryParams = parseQueryParams(url);
  delete queryParams[paramName];

  const queryString = buildQueryString(queryParams);
  const { hash } = splitHash(url);
  const base = clearQueryParams(url);

  return queryString ? `${base}?${queryString}${hash}` : base;
}

export function updateQueryParams(
  params: Record<string, QueryValue>,
  url: string
): string {
  const queryParams = parseQueryParams(url);

  for (const key in params) {
    queryParams[key] = String(params[key]);
  }

  const queryString = buildQueryString(queryParams);
  const { hash } = splitHash(url);
  const base = clearQueryParams(url);

  return queryString ? `${base}?${queryString}${hash}` : base;
}
