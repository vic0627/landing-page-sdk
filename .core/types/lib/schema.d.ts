import { RouteMode, ViteMode } from './types';

export interface ViteExecutorSchema {
  cwd: string;
  mode: ViteMode;
  verbose?: boolean;
  host?: boolean;
  port?: number;
  /**
   * landing page 設定檔
   * @default 'site.config.js'
   */
  config?: string;
  sites?: string;
}

export interface TemplateGeneratorSchema {
  name: string;
  path: string;
  routeMode?: RouteMode;
}
