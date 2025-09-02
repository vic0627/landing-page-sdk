import { $all } from './dom';
import { detectLang } from './lang';

const __LOADER__ = '__LOADER__';

type MediaElement = HTMLVideoElement | HTMLImageElement | HTMLPictureElement;
type LoaderId = { [__LOADER__]: symbol };
type Loader<L> = (el: L) => void;
type RegisteredLoader<L> = Loader<L> & LoaderId;

let observer: IntersectionObserver;
const loaderMap: Map<
  symbol,
  { loader: RegisteredLoader<Element>; className: string }
> = new Map();

export const createLoader = <L>(
  loader: Loader<L>,
  id?: string
): RegisteredLoader<L> => {
  const symbolId = Symbol(id);

  Object.defineProperty(loader, __LOADER__, { value: symbolId });

  return loader as RegisteredLoader<L>;
};

const loadVideo = /* @__PURE__ */ createLoader<MediaElement>((video) => {
  if (!(video instanceof HTMLVideoElement)) return;

  const sources = Array.from(video.getElementsByTagName('source'));
  sources.forEach((source) => {
    source.srcset = source.dataset['srcset'] ?? '';
  });

  video.load();
}, 'LAZY_VIDEO');

const loadImage = /* @__PURE__ */ createLoader<MediaElement>((img) => {
  if (!(img instanceof HTMLImageElement)) return;

  const lang = detectLang();

  const [path, imageNameAndType] = img.dataset['src']?.split('images/') ?? [];
  if (!path) return;
  const [imageName, imgType] = imageNameAndType.split('.');

  if (imageName === 'logo')
    img.src = `${path}images/${imageName}_${lang}.${imgType}`;
  else img.src = img.dataset['src'] ?? '';
}, 'LAZY_IMAGE');

const loadPicture = /* @__PURE__ */ createLoader<MediaElement>((pic) => {
  if (!(pic instanceof HTMLPictureElement)) return;

  const sources = Array.from(pic.getElementsByTagName('source'));
  sources.forEach((source) => {
    source.srcset = source.dataset['srcset'] ?? '';
  });

  const img = pic.querySelector('img');
  if (img) loadImage(img);
}, 'LAZY_PICTURE');

const loadBackgroundImage = /* @__PURE__ */ createLoader<HTMLElement>((el) => {
  const url = el.getAttribute('data-bg');
  if (url) el.style.backgroundImage = `url('${url}')`;
}, 'LAZY_BACKGROUND_IMAGE');

export const lazyWrap = <E extends Element>(
  className: string,
  loader: RegisteredLoader<E>
) => {
  const lazyTargets = $all(className) as NodeListOf<E>;

  if (!('IntersectionObserver' in window)) return lazyTargets.forEach(loader);
  if (!loader.__LOADER__) return;

  className = className.split('.')[1];
  loaderMap.has(loader.__LOADER__) ||
    loaderMap.set(loader.__LOADER__, {
      loader: loader as RegisteredLoader<Element>,
      className,
    });

  observer ??= new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target as E & LoaderId;

      if (loaderMap.has(el.__LOADER__)) {
        const { loader, className } = loaderMap.get(el.__LOADER__)!;
        loader(el);
        el.classList.remove(className);
      }

      observer.unobserve(el);
    });
  });
  lazyTargets.forEach((lazyItem) => {
    Object.defineProperty(lazyItem, __LOADER__, { value: loader.__LOADER__ });
    observer.observe(lazyItem);
  });
};

/**
 * 懶加載影片資源
 *
 * 該函數負責為指定的 `video` 元素進行懶加載。當用戶滾動到指定的 `video` 元素時，才會開始載入 `source` 標籤中的影片資源。
 *
 * @param className - 指定用於懶加載的影片元素的 class 名稱。預設為 "lazy"。
 * @example
 * // 對含有 lazyVideo class 名稱的 video 元素進行懶加載
 * document.addEventListener("DOMContentLoaded", () => lazyLoadVideos("lazyVideo"));
 */
export function lazyLoadVideos(className: string = 'lazy') {
  lazyWrap(`video.${className}`, loadVideo);
}

/**
 * 懶加載圖片資源
 *
 * 該函數負責為指定的圖片元素進行懶加載。當用戶滾動到指定的圖片元素時，才會開始載入圖片資源。
 *
 * @param className - 指定用於懶加載的圖片元素的 class 名稱。預設為 "lazy"。
 * @example
 * // 對含有 lazyImage class 名稱的圖片元素進行懶加載
 * document.addEventListener("DOMContentLoaded", () => lazyLoadImages("lazyImage"));
 */
export function lazyLoadImages(className: string = 'lazy') {
  lazyWrap(`img.${className}`, loadImage);
}

/**
 * 懶加載 `<picture>` 圖片資源
 *
 * 該函數負責為指定的 `<picture>` 元素進行懶加載。當用戶滾動到指定的 `<picture>` 元素時，才會開始載入 `source` 和 `img` 標籤中的圖片資源。
 *
 * 當懶加載觸發後，它會處理 `<picture>` 元素中的所有 `<source>`，動態設置 `srcset`，並將 `img` 元素的 `src` 屬性設置為正確的圖片資源。
 *
 * @param className - 指定用於懶加載的 `<picture>` 元素的 class 名稱。預設為 "lazy"。
 *
 * @example
 * // 對含有 lazyPicture class 名稱的 <picture> 元素進行懶加載
 * document.addEventListener("DOMContentLoaded", () => lazyLoadPictures("lazyPicture"));
 */
export function lazyLoadPictures(className: string = 'lazy') {
  lazyWrap(`picture.${className}`, loadPicture);
}

/**
 * 懶加載 CSS background-image 圖片資源
 *
 * 該函數負責為含有 className 的元素進行懶加載。當用戶滾動到指定的元素時，才會開始載入 CSS background-image 中的圖片資源。
 *
 * 當懶加載觸發後，它會解析目標元素的 `data-bg` 屬性，若 `data-bg` 不為空，將以其值作為新的 background-image URL，並以 inline style 的方式注入。
 *
 * @param className - 指定用於懶加載元素的 class 名稱。預設為 "lazyBg"。
 *
 * @example
```js
// 對含有 lazyBg class 名稱的元素進行 background-image 懶加載
document.addEventListener("DOMContentLoaded", () => lazyLoadBackgroundImage());
```
 * 
 * @example
```css
// 為 .lazyBg 加上樣式，就不用在 html 給予 data-bg 屬性
.lazyBg {
  background-image: none !important;
}
```
 *
 * @example
```html
<!-- 動態插入圖片 -->
<div class="lazyBg" data-bg="/assets/images/<%= lang =>/bg_01.png"></div>
```
 */
export function lazyLoadBackgroundImage(className: string = 'lazyBg') {
  lazyWrap(`.${className}`, loadBackgroundImage);
}
