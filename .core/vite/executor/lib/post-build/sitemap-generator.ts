import { createWriteStream } from 'node:fs';
import fsp from 'node:fs/promises';
import { Readable } from 'node:stream';
import chalk from 'chalk';
import { isPlainObject, isString, merge, pick } from 'lodash-es';
import { SitemapStream, SitemapIndexStream, streamToPromise } from 'sitemap';
import { Page, SiteContext, SitemapOption } from '@landing-page-sdk/types';
import { getPathFromRoot, join } from '@landing-page-sdk/utils-node';
import { namedLogger, REGEXP } from '../common';

const log = namedLogger({ name: 'sitemap-generator', verbose: true });

export default async function (ctx: SiteContext, outDir: string) {
  const { siteConfig, pagesInfo } = ctx;

  if (!siteConfig.sitemap) {
    // if baseUrl or config doesn't exist, close this plugin
    return;
  }

  const sitemapOption: Required<SitemapOption> = {
    baseUrl: '',
    enable: true,
    orientation: 'file',
    exclude: [],
    defaults: {},
    useAliasAsPath: true,
  };

  // normalize options
  if (isString(siteConfig.sitemap)) {
    sitemapOption.baseUrl = siteConfig.sitemap;
  } else if (isPlainObject(siteConfig.sitemap)) {
    if (siteConfig.sitemap.enable === false) {
      // if not enable, close this plugin
      return;
    }

    merge(sitemapOption, siteConfig.sitemap);
  }

  const { sites, langInfo, pages } = pagesInfo;
  const { langs } = langInfo;

  const routes = pagesToRoutes(pages, sites, sitemapOption);

  const generatorOption: GeneratorOptions = {
    routes,
    sites,
    outDir,
    option: sitemapOption,
  };

  await (langs.length < 2
    ? generateSitemap(generatorOption)
    : generateSitemapIndex({
        ...generatorOption,
        langs,
        defaultLang:
          (siteConfig.env && (siteConfig.env as any)['defaultLang']) ||
          langs[0],
      }));
}

type RouteInfo = {
  /** 加上 hostname 就是完整 url */
  path: string;
  /** 所屬站點。若存在，會影響 build 輸出位置（outDir/site） */
  site?: string;
  /** 所屬語系 */
  lang?: string;
  /** 同一內容頁的語意鍵（不含語系） */
  key?: string;
  siteAlias?: string;
};

function pagesToRoutes(
  pages: Page[],
  siteAliasMap: Record<string, string>,
  options: Required<SitemapOption>
) {
  pages = pages.filter(
    (page) => !(REGEXP.REDIRECT.test(page.name) || REGEXP.STUB.test(page.name))
  );

  const routes = pages.map((page) => {
    let { filename, data } = page;

    if (data?.site) {
      filename = filename.replace(data.site, '');
    }

    filename = leadingSlash(filename);

    if (options.orientation === 'dir' && filename.endsWith('index.html')) {
      filename = filename.replace('index.html', '');
    }

    return {
      path: filename,
      key: page.route || undefined,
      ...pick(data, 'site', 'lang'),
      siteAlias: siteAliasMap[data?.site as string],
    };
  }) as RouteInfo[];

  return routes;
}

type GeneratorOptions = {
  routes: RouteInfo[];
  /** Record<站點名稱, 實際路徑對照（可能為空字串）> */
  sites: Record<string, string>;
  /** build 輸出資料夾 */
  outDir: string;
  option: Required<SitemapOption>;
};

/**
 * 單語系站點的 Sitemap 產生器（每個 site 一份 sitemap.xml）
 *
 * 開發者說明：
 * - 呼叫時機：當專案僅有單一語系（langs.length < 2）。
 * - 輸出位置：dist/<site>/sitemap.xml；若無 site（單站），輸出於 dist/sitemap.xml。
 * - URL 產生：一律透過 absoluteUrl() 以 baseUrl 合成「絕對 URL」。
 * - 排除規則：套用 option.exclude（字串或 RegExp），與 _dist 樣本一致。
 * - XML 輸出：完全交由 sitemap 套件（SitemapStream）生成，不做字串手拼。
 */
async function generateSitemap(option: GeneratorOptions) {
  const { routes, sites, outDir, option: opt } = option;

  const grouped = groupBySite(
    routes.filter((r) => !isExcluded(r.path, opt.exclude))
  );

  // 逐 site 產一份 sitemap.xml
  for (const [site, list] of grouped.entries()) {
    const links = list.map((r) => ({
      url: absoluteUrl(r, option),
      changefreq: opt.defaults.changefreq,
      priority: opt.defaults.priority,
      // 也可加 lastmod：這裡留白，若你之後要接 git mtime 可在這裡補
    }));

    const dir = join(outDir, site);
    await ensureDir(dir);

    // 我們已經餵「絕對 URL」，故 SitemapStream 無需指定 hostname
    // 注意：使用 streamToPromise 讓串流完整寫入後再落盤，避免空流結束（EmptyStream）錯誤
    const stream = new SitemapStream();
    const xml = await streamToPromise(Readable.from(links).pipe(stream)).then(
      (d) => d.toString()
    );

    const file = join(dir, 'sitemap.xml');
    log(`generate sitemap ${outputSitemapPath(file)}`);
    await fsp.writeFile(file, xml, 'utf8');
  }
}

type MultiLangGeneratorOptions = GeneratorOptions & {
  langs: string[];
  defaultLang?: string;
};

/**
 * 多語系站點的 Sitemap 產生器（每個 site 一份 sitemap_index.xml + 各語系分卷）
 *
 * 開發者說明：
 * - 呼叫時機：當專案擁有 2 種（含）以上語系。
 * - 分卷策略：
 *   - 每個 site -> 建立子資料夾 `__SITEMAP__/`，依語代碼輸出 `<lang>.xml`。
 *   - 每個 `<lang>.xml` 僅含該語系的 URL，並透過 links 輸出 hreflang 互指（含 x-default）。
 *   - 於站點根輸出 `sitemap_index.xml`，列出各語系卷的絕對 URL。
 * - 語系偵測：以實際 routes 中出現的語系為準（siteLangs），避免產生空檔。
 * - URL 與 hreflang：
 *   - 以 Page.route（或回退 path）作為「同一內容頁」的 key 來跨語對應。
 *   - x-default 指向 siteConfig.env.defaultLang，若未設定則回退第一語系。
 * - baseUrl 支援：字串或 Record（多站映射）；同時考慮 sites[site] 的路徑前綴。
 * - XML 輸出：完全交由 sitemap 套件（SitemapStream、SitemapIndexStream）生成。
 * - 串流落盤：務必先取得 streamToPromise，再 end 流，避免 EmptyStream 例外。
 */
async function generateSitemapIndex(option: MultiLangGeneratorOptions) {
  const { routes, sites, outDir, option: opt, langs, defaultLang } = option;

  const grouped = groupBySite(
    routes.filter((r) => !isExcluded(r.path, opt.exclude))
  );

  for (const [site, list] of grouped.entries()) {
    const dir = join(outDir, site);
    const subDir = join(dir, '__SITEMAP__');
    await ensureDir(dir);
    await ensureDir(subDir);

    // 僅處理此站點實際存在的語系，避免產生空卷導致 EmptyStream 錯誤
    const siteLangs = Array.from(
      new Set(list.map((r) => r.lang).filter((x): x is string => !!x))
    );

    const writtenLangs: string[] = [];

    // 逐語系生成分卷：__SITEMAP__/<lang>.xml
    for (const lang of siteLangs) {
      // 依語系過濾當前站點的 routes
      const currentLangRoutes = list.filter((r) => r.lang === lang);
      if (!currentLangRoutes.length) {
        continue;
      }

      // 以 key 分組，便於產生 hreflang 互指
      const byKey = new Map<string, RouteInfo[]>();
      for (const r of currentLangRoutes) {
        const k = r.key || r.path; // fallback
        if (!byKey.has(k)) byKey.set(k, []);
        byKey.get(k)!.push(r);
      }
      if (byKey.size === 0) {
        // 無任何 URL 可寫入，避免建立空白檔案
        continue;
      }

      // 構建全語系映射：key -> [RouteInfo]，供 links 互指使用
      const allByKey = new Map<string, RouteInfo[]>();
      for (const r of list) {
        const k = r.key || r.path;
        if (!allByKey.has(k)) allByKey.set(k, []);
        allByKey.get(k)!.push(r);
      }

      // 用 SitemapStream 產生此語系分卷；改以檔案串流的 finish 事件確認完成
      const sm = new SitemapStream();
      const diskPath = join(subDir, `${lang}.xml`);
      const ws = createWriteStream(diskPath);
      sm.pipe(ws);
      log(`generate sitemap ${outputSitemapPath(diskPath)}`);

      for (const [k, items] of byKey.entries()) {
        // 當前語系的主要路由（理論上單一）
        const primary = items[0];
        const url = absoluteUrl(primary, option);

        // 產生 hreflang 互指（含 x-default）
        const alternatesSrc = allByKey.get(k) || [];
        const alternates = alternatesSrc
          .filter((r) => !!r.lang)
          .sort((a, b) => (a!.lang! < b!.lang! ? -1 : 1))
          .map((r) => ({ lang: r.lang!, url: absoluteUrl(r, option) }));

        // x-default 指向預設語系（若不在 alternates 中，略過）
        const defaultLangCode =
          defaultLang && langs.includes(defaultLang) ? defaultLang : langs[0];
        const def = alternates.find((l) => l.lang === defaultLangCode);
        const links = def
          ? [...alternates, { lang: 'x-default', url: def.url }]
          : alternates;

        sm.write({
          url,
          changefreq: opt.defaults.changefreq,
          priority: opt.defaults.priority,
          links,
        });
      }

      // 正確結尾並等待檔案寫入完成
      await new Promise<void>((resolve, reject) => {
        ws.on('finish', () => resolve());
        ws.on('error', reject);
        sm.end();
      });
      writtenLangs.push(lang);
    }

    // 生成 sitemap_index.xml 指向每語系卷
    const base = parseBase(opt.baseUrl, site);

    if (writtenLangs.length) {
      // 注意：本專案以 _dist 樣本為準，使用 `sitemap_index.xml`（含底線）
      const indexPath = join(dir, 'sitemap_index.xml');
      const smis = new SitemapIndexStream();
      const wsIndex = createWriteStream(indexPath);
      smis.pipe(wsIndex);
      log(`generate sitemap_index ${outputSitemapPath(indexPath)}`);

      for (const lang of writtenLangs) {
        const urlPath = leadingSlash(
          // 這裡是部署後實際路徑，要取 site alias
          (sites[site] ? `/${sites[site]}` : '') + `/__SITEMAP__/${lang}.xml`,
          false
        ).replace(/\/{2,}/g, '/');
        const loc = new URL(urlPath, base).toString();
        // SitemapIndexStream 只需要 index 條目的絕對 URL
        smis.write({ url: loc });
      }
      // 與上方相同：先註冊 promise，再 end()
      await new Promise<void>((resolve, reject) => {
        wsIndex.on('finish', () => resolve());
        wsIndex.on('error', reject);
        smis.end();
      });
    }
  }
}

function leadingSlash(p: string, lead: boolean = true) {
  if (lead) {
    return p.startsWith('/') ? p : '/' + p;
  } else {
    return p.startsWith('/') ? p.slice(1) : p;
  }
}

/** 取得此 route 對應的絕對 URL（考慮多站 baseUrl） */
function absoluteUrl(route: RouteInfo, options: GeneratorOptions) {
  const { site, siteAlias } = route;
  const { option: sitemapOption } = options;
  const base = parseBase(sitemapOption.baseUrl, site);

  let path = route.path;

  if (sitemapOption.useAliasAsPath && siteAlias) {
    path = join(siteAlias, path);
  }

  const u = new URL(leadingSlash(path), base);
  return u.toString();
}

function parseBase(baseUrl: string | Record<string, string>, site?: string) {
  const base =
    typeof baseUrl === 'string'
      ? baseUrl
      : baseUrl[site ?? ''] ?? baseUrl['default'] ?? ''; // 允許使用 'default' 鍵

  if (!base) {
    throw new Error(`[sitemap] Missing baseUrl for site "${site ?? ''}"`);
  }

  return base;
}

/** 排除 */
function isExcluded(path: string, patterns: (string | RegExp)[] = []) {
  return patterns.some((p) => {
    if (p instanceof RegExp) {
      return p.test(path);
    }

    return p === path;
  });
}

/** 依 site 分組（undefined 視為空字串組） */
function groupBySite(routes: RouteInfo[]) {
  const map = new Map<string, RouteInfo[]>();

  for (const r of routes) {
    const key = r.site ?? '';

    if (!map.has(key)) {
      map.set(key, []);
    }

    map.get(key)!.push(r);
  }

  return map;
}

function ensureDir(dir: string) {
  return fsp.mkdir(dir, { recursive: true });
}

function outputSitemapPath(path: string) {
  return chalk.green(path.replace(getPathFromRoot(), ''));
}
