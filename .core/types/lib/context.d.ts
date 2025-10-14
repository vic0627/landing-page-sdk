import { PluginOption } from 'vite';
import { NormalizedSiteConfig } from './normalized';
import { PagesInfo } from './page';
import { ViteExecutorSchema } from './vite';

export interface SiteContext {
  readonly pagesInfo: PagesInfo;
  readonly cliOption: ViteExecutorSchema;
  readonly siteConfig: NormalizedSiteConfig;
}

export type SDKPlugin = (ctx: SiteContext) => PluginOption;
