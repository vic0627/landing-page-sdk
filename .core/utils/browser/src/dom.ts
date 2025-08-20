/**
 * document.querySelector 的縮寫
 */
export function $(selectors: string) {
  return document.querySelector(selectors);
}

/**
 * document.querySelectorAll 的縮寫
 */
export function $all(selectors: string) {
  return document.querySelectorAll(selectors);
}
