/**
 * 設置一個帶有過期時間的 Cookie。
 *
 * @param name - Cookie 的名稱。
 * @param value - Cookie 的值。
 * @param days - Cookie 的有效天數，預設為 1 天。
 */
export function setCookie(name: string, value: string, days: number = 1): void {
  const expireDate = new Date(Date.now() + days * 864e5);
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )};expires=${expireDate.toUTCString()};path=/`;
}

/**
 * 獲取指定名稱的 Cookie 值。
 *
 * @param name - 要獲取的 Cookie 名稱。
 * @returns 返回對應的 Cookie 值，如果沒有找到則返回空字串。
 */
export function getCookie(name: string): string {
  const nameEQ = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie.split(";").map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return "";
}

/**
 * 刪除指定名稱的 Cookie。
 *
 * @param name - 要刪除的 Cookie 名稱。
 */
export function eraseCookie(name: string): void {
  document.cookie = `${encodeURIComponent(name)}=; Max-Age=0; path=/`;
}

/**
 * 獲取所有的 Cookie 並返回一個對象。
 *
 * @returns 返回包含所有 Cookie 的對象。
 */
export function getAllCookies(): Record<string, string> {
  const cookies: Record<string, string> = {};
  document.cookie.split(";").forEach((cookie) => {
    const [name, value] = cookie.split("=").map((part) => part.trim());
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  });
  return cookies;
}

/**
 * 檢查指定名稱的 Cookie 是否存在。
 *
 * @param name - 要檢查的 Cookie 名稱。
 * @returns 如果存在返回 true，否則返回 false。
 */
export function checkCookie(name: string): boolean {
  return getCookie(name) !== "";
}
