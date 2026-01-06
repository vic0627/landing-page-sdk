import { DOMWindow } from 'jsdom';
import { PluginOption } from 'vite';
import { BuildOptions } from 'esbuild';
import {
  ScriptSourceType,
  Phase,
  HTMLAppendTarget,
  Versioning,
  Resolution,
  MinifyTargets,
  RouteMode,
  DestOrientation,
} from './types';
import { Page } from './page';

export interface ControllerTarget {
  routes: string | string[];
  lang?: string | string[];
  site?: string | string[];
}

export interface ControllerInjection {
  /**
   * Inject inline into HTML or bundle into JS.
   * @default 'bundle'
   */
  type?: ScriptSourceType;
  /**
   * @default 'post'
   */
  placement?: Phase;
  /**
   * Where to append inline script in HTML.
   * Note: only effective when `type: 'inline'`.
   * @default 'head'
   */
  appendTo?: HTMLAppendTarget;
  /**
   * Whether to bundle before injecting inline.
   * Note: only effective when `type: 'inline'`.
   * @default true
   */
  bundle?: boolean;
  esbuildOptions?: Omit<BuildOptions, 'entryPoints' | 'bundle' | 'write' | 'plugins' | 'inject'>;
}

export interface ControllerOption {
  /**
   * Controller name
   * - see `.core/assets/controller/*`
   */
  name: string;
  /**
   * Injection targets
   * - `string`: single route (all sites/langs)
   * - `string[]`: multiple routes (all sites/langs)
   * - `ControllerTarget`: scoped by site/lang/routes (intersection)
   * @default '/'
   */
  targets?: string | string[] | ControllerTarget;
  /**
   * Injection mode
   * - `inline`: inject script directly into HTML (`<head>` end by default)
   * - `bundle`: include in Vite bundle, inject into page main.js by default
   * @default 'bundle'
   */
  injection?: ScriptSourceType | ControllerInjection;
}

export interface SitemapDefaults {
  changefreq?: 'daily' | 'weekly' | 'monthly';
  priority?: number;
}

export interface SitemapOption {
  /**
   * Base URL per site
   */
  baseUrl: string | Record<string, string>;
  /**
   * Enable sitemap output
   * @default false
   */
  enable?: boolean;
  /**
   * URL orientation for sitemap entries
   * @default 'file'
   */
  orientation?: DestOrientation;
  /**
   * Exclusion rules (route match)
   */
  exclude?: (string | RegExp)[];
  /**
   * Default fields (overridable by page.data.sitemap)
   */
  defaults?: SitemapDefaults;
  /**
   * @default false
   */
  useSiteAsPath?: boolean;
}

export interface RedirectOption {
  /**
   * Generate a root redirect page to detect language and forward to the locale home.
   * @default true
   */
  enable?: boolean;
  /**
   * Generate per-route stubs for non-prefixed routes (e.g., `/about/me` -> `/en/about/me`).
   * @default false
   */
  stub?: boolean;
  /**
   * Default language for redirect
   * @deprecated
   */
  defaultLang?: string;
  /**
   * Hook to mutate redirect page DOM (logic is fixed; structure can be adjusted).
   *
   * @param page current page info
   * @this DOMWindow JSDOM window object
   */
  transform?(this: DOMWindow, page: readonly Page): void | Promise<void>;
}

export interface OutputOption {
  /**
   * Whether to minify output files.
   * - `true`: minify all (HTML, JS, CSS).
   * - `false`: do not minify.
   * - string: minify only that target, e.g. `'js'`.
   * - array: minify multiple targets, e.g. `['html', 'css']`.
   * @default true
   */
  minify?: boolean | MinifyTargets | MinifyTargets[];
  /**
   * Output file versioning strategy.
   * - `'hard'`: hashed filenames, e.g. `[name].[hash].[ext]`.
   * - `'soft'`: stable filenames with query hash, e.g. `[name].[ext]?v=[hash]`.
   * @default 'hard'
   */
  versioning?: Versioning;
  /**
   * Path strategy for emitted assets.
   * - `'abs'`: absolute paths, e.g. `/__ASSETS__/main.hash.js`.
   * - `'rel'`: relative paths; e.g. on `/en/about/me/index.html` -> `../../../__ASSETS__/main.hash.js`.
   * 
   * Note: HTML only.
   * 
   * @default 'abs'
   */
  assetsResolution?: Resolution;
  /**
   * Size warning threshold for media assets (bytes).
   */
  threshold?: number;
  /**
   * Output directory for build artifacts.
   * @default '{workspaceRoot}/dist'
   */
  dist?: string;
}

export interface RouteHiddenRule {
  /**
   * Route matcher(s). Accepts exact path or RegExp; arrays are ORed.
   * Matched against `page.route` (or `stubFor` if stub page).
   */
  route: string | RegExp | (string | RegExp)[];
  /**
   * Limit hiding to specific site(s); omit to apply to all sites.
   */
  site?: string | string[];
  /**
   * Limit hiding to specific language(s); omit to apply to all languages.
   */
  lang?: string | string[];
  /**
   * Optional human-readable reason for logging.
   */
  reason?: string;
}

export interface RouteOption {
  /**
   * Route structure
   * - `tree`: folder-like, lang prefix, mirrors `src/pages`.
   * - `flat`: all outputs at root, filenames include path/lang (e.g., `about_me_en.html`).
   * @default 'tree'
   */
  mode?: RouteMode;
  /**
   * Rendered path style for `data-to` internal links
   * @default 'rel'
   */
  resolution?: Resolution;
  /**
   * Internal link orientation (dir vs file) for `data-to`
   * - dir-based: trailing slash, e.g., `/about/me/`
   * - file-based: explicit html, e.g., `/about_me_zh.html`
   *
   * Note: `dir` only effective when `mode: 'tree'`.
   * @default 'dir'
   */
  orientation?: DestOrientation;
  /**
   * @default false
   */
  useSiteAsPath?: boolean;
  /**
   * Rules to hide routes by path/site/lang.
   */
  hidden?: RouteHiddenRule | RouteHiddenRule[];
}

export interface SourcePathOption {
  /**
   * Pages path
   * @default './src/pages'
   */
  pages?: string;
  /**
   * Components path
   * @default './src/components'
   */
  components?: string;
  /**
   * I18n resources path
   * @default './src/i18n'
   */
  i18n?: string;
  /**
   * Site scripts path
   * @default './src/sites'
   */
  sites?: string;
  /**
   * Public assets path
   * @default './public'
   */
  public?: string;
}

export interface SiteConfig {
  /**
   * Route config
   * @default 'tree'
   */
  route?: RouteMode | RouteOption;
  /**
   * Output config
   */
  output?: OutputOption;
  /**
   * Redirect config
   */
  redirect?: boolean | RedirectOption;
  /**
   * Source path config
   */
  sourcePath?: SourcePathOption;
  /**
   * vite plugins
   */
  plugins?: PluginOption[];
  /**
   * Environment variables
   */
  env?: Record<string, any>;
  /**
   * Controller injection config
   */
  controller?: ControllerOption | ControllerOption[];
  /**
   * Sitemap output config
   */
  sitemap?: string | SitemapOption;
  /**
   * API mock config
   * - `false`: disable mocks
   * - string: path to handlers
   * @default '@landing-page-sdk/assets/mock'
   */
  mock?: boolean | string;
}
