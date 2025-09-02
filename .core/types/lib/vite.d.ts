import { Plugin, PluginOption } from 'vite';
import { DOMWindow } from 'jsdom';

export type ViteMode = 'dev' | 'build' | 'preview';

export type RouteMode = 'flat' | 'tree';

export type Phase = 'pre' | 'post';

export type MinifyTargets = 'html' | 'js' | 'css';

export type Versioning = 'hard' | 'soft';

export type AssetsBaseType = 'abs' | 'rel';

export type ScriptSourceType = 'inline' | 'bundle';

export interface ViteExecutorSchema {
  cwd: string;
  mode: ViteMode;
  host?: boolean;
  port?: number;
  config?: string;
  sites?: string;
  minify?: boolean | string;
  versioning?: Versioning;
  assets?: AssetsBaseType;
}

export interface ControllerTarget {
  routes: string | string[];
  lang?: string | string[];
  site?: string | string[];
}

export interface ControllerInjection {
  /** @default 'bundle' */
  type?: ScriptSourceType;
  appendTo?: 'head' | 'body';
  placement?: Phase;
}

export interface ControllerOption {
  name: string;
  /** @default '/' */
  targets?: string | string[] | ControllerTarget;
  /** @default 'bundle' */
  injection?: ScriptSourceType | ControllerInjection;
}

export interface SiteOptions {
  /** @default 'tree' */
  routeMode?: RouteMode;
  /** @default false */
  enableStubRedirect?: boolean;
  sourcePath?: {
    /** @default './src/pages' */
    pages?: string;
    /** @default './src/components' */
    components?: string;
    /** @default './src/i18n' */
    i18n?: string;
    /** @default './src/sites' */
    sites?: string;
    /** @default './public' */
    public?: string;
  };
  plugins?: PluginOption[];
  env?: Record<string, any>;
  append?: {
    /** @default 'pre' */
    siteScript?: Phase;
  };
  /** @default true */
  minify?: boolean | MinifyTargets | MinifyTargets[];
  transformRedirect?(this: DOMWindow, page: Page): void | Promise<void>;
  /** @default 'hard' */
  versioning?: Versioning;
  /** @default 'abs' */
  assets?: AssetsBaseType;
  threshold?: number;
  controller?: ControllerOption | ControllerOption[];
}

export interface Page {
  name: string;
  filename: string;
  template: string;
  entry?: string;
  siteScript?: string;
  data: Record<string, any>;
}

export interface PagesInfo {
  pages: page[];
  langInfo: I18nInfo;
  sites: string[];
}

export interface I18nLangPack {
  [x: string]: string | I18nLangPack;
}

export interface I18nInfo {
  langs: string[];
  langPack: I18nLangPack;
}

export interface SiteContext {
  readonly pagesInfo: PagesInfo;
  readonly cliOptions: ViteExecutorSchema;
  readonly siteOptions: SiteOptions;
}

export type SDKPlugin = (ctx: SiteContext) => PluginOption;
