import { PluginOption } from 'vite';

export type ViteMode = 'dev' | 'build' | 'preview';

export type RouteMode = 'flat' | 'tree';

export type ScriptAppendPosition = 'pre' | 'post';

export type MinifyTargets = 'html' | 'js' | 'css';

export interface ViteExecutorSchema {
  cwd: string;
  mode: ViteMode;
  host?: boolean;
  port?: number;
  config?: string;
  sites?: string;
  minify?: boolean | string;
}

export interface SiteOptions {
  /** @default 'tree' */
  routeMode?: RouteMode;
  sourcePath?: {
    /** @default './src/pages' */
    pages?: string;
    /** @default './src/components' */
    components?: string;
    /** @default './src/i18n' */
    i18n?: string;
    /** @default './src/sites' */
    sites?: string;
  };
  plugins?: PluginOption[];
  env?: Record<string, any>;
  append?: {
    /** @default 'pre' */
    siteScript?: ScriptAppendPosition;
  };
  /** @default true */
  minify?: boolean | MinifyTargets | MinifyTargets[];
}

export interface Page {
  name: string;
  filename: string;
  template: string;
  entry?: string;
  siteScript?: string;
  data: Record<string, any>;
}

export interface I18nLangPack {
  [x: string]: string | I18nLangPack;
}

export interface I18nInfo {
  langs: string[];
  langPack: I18nLangPack;
}
