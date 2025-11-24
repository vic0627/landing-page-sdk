import { RouteMode, ViteMode } from './types';

export interface ViteExecutorSchema {
  cwd: string;
  mode: ViteMode;
  verbose?: boolean;
  host?: boolean;
  port?: number;
  /**
   * landing page 設定檔
   * @default 'site.config.ts'
   * @default 'site.config.js'
   */
  config?: string;
  sites?: string;
}

type Framework = 'vue' | 'react' | 'none';

type Style = 'sass' | 'tailwindcss';

export interface TemplateGeneratorSchema {
  name: string;
  path: string;
  routeMode: RouteMode;
  useTs: boolean;
  framework: Framework;
  style: Style[];
}
