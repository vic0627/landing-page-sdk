import { PluginOption } from 'vite';

export type RouteMode = 'flat' | 'tree';

export type ScriptAppendPosition = 'pre' | 'post';

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
}

export interface ViteExecutorSchema {
  cwd: string;
  mode: 'dev' | 'build' | 'preview';
  host?: boolean;
  port?: number;
  config?: string;
  sites?: string[];
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

export type ComponentLayer = 'core' | 'top' | 'local';

export interface TemplateAPI {
  cmp(filePath: string, layer?: ComponentLayer): string;
}
