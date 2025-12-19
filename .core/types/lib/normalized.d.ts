import { PluginOption } from 'vite';
import {
  ControllerOption,
  RedirectOption,
  RouteOption,
  SourcePathOption,
  ControllerInjection,
  SitemapOption,
  SiteConfig,
  RouteHiddenRule,
} from './options';
import { Resolution, MinifyTargets, Versioning } from './types';

export interface NormalizedRouteOption extends Required<RouteOption> {
  hidden: RouteHiddenRule[];
}

export interface NormalizedOutputOption {
  minify: Record<MinifyTargets, boolean>;
  versioning: Versioning;
  assetsResolution: Resolution;
  threshold: number;
  dist: string;
}

export type NormalizedRedirectOption = Required<RedirectOption>;

export type NormalizedSourcePathOption = Required<SourcePathOption>;

export interface NormalizedControllerTarget {
  routes: string[];
  lang: string[];
  site: string[];
}

export type NormalizedControllerInjection = Required<ControllerInjection>;

export interface NormalizedControllerOption {
  name: string;
  targets: NormalizedControllerTarget;
  injection: NormalizedControllerInjection;
}

export type NormalizedSitemapOption = Omit<Required<SitemapOption>, 'baseUrl'> & {
  baseUrl: Record<string, string>;
};

export interface NormalizedSiteConfig {
  route: NormalizedRouteOption;
  output: NormalizedOutputOption;
  redirect: NormalizedRedirectOption;
  sourcePath: NormalizedSourcePathOption;
  plugins: PluginOption[];
  env: Record<string, any>;
  controller: NormalizedControllerOption[];
  sitemap: NormalizedSitemapOption;
  mock: boolean | string;
}

export type SiteConfigNormalizer = (siteConfig: SiteConfig) => NormalizedSiteConfig;

export type OptionNormalizer = (opt: NormalizedSiteConfig, cfg: SiteConfig) => void;
