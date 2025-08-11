import { PluginOption } from 'vite';

export interface SiteOptions {
  sourcePath?: {
    pages?: string;
    components?: string;
    i18n?: string;
    sites?: string;
  };
  plugins?: PluginOption[];
  env?: Record<string, any>;
}

export interface ViteExecutorSchema {
  cwd: string;
  mode: 'dev' | 'build' | 'preview';
  host?: boolean;
  port?: number;
  config?: string;
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
