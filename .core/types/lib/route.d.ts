import { NormalizedRouteOption } from './normalized';

export interface RouteDict {
  site: string[];
  locale: string[];
  route: string[];
}

export type RouteMapKey = `${number},${number},${number},${number},${number}`;

export interface RouteMeta extends NormalizedRouteOption {
  keyOrder: ['site', 'fromLocale', 'toLocale', 'fromRoute', 'toRoute'];
}

export interface RouteManifest {
  meta: RouteMeta;
  dict: RouteDict;
  map: Record<RouteMapKey, string>;
}

export type RouteResolveOption = {
  site?: string;
  fromLocale?: string;
  toLocale?: string;
  fromRoute: string;
  toRoute: string;
};

export type RouteResolver = (option: RouteResolveOption) => string;

/**
 * @deprecated
 */
export type RedirectManifest = Record<string, string | Record<string, string>>;
