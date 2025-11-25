/**
 * 動態加載一個 JavaScript 文件，並在加載完成後執行回調函式。
 *
 * @param src - 要加載的 JavaScript 文件的 URL。
 * @param cb - 加載完成後要執行的回調函式。
 * @returns 返回一個 Promise，當腳本加載完成並執行回調後，Promise 會被 resolve。
 */
export function loadScript<T>(src: string, cb?: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    script.onload = () => {
      try {
        const result = cb?.();
        resolve(result as T);
      } catch (error) {
        reject(error);
      }
    };

    script.onerror = () => {
      reject(new Error(`Failed to load script: ${src}`));
    };

    document.head.appendChild(script);
  });
}

/**
 * 動態加載一個 CSS 文件，並在加載完成後執行回調函式。
 *
 * @param src - 要加載的 CSS 文件的 URL。
 * @param cb - 加載完成後要執行的回調函式。
 * @returns 返回一個 Promise，當樣式加載完成並執行回調後，Promise 會被 resolve。
 */
export function loadCss<T>(src: string, cb?: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = src;

    link.onload = () => {
      try {
        const result = cb?.();
        resolve(result as T);
      } catch (error) {
        reject(error);
      }
    };

    link.onerror = () => {
      reject(new Error(`Failed to load CSS: ${src}`));
    };

    document.head.appendChild(link);
  });
}
