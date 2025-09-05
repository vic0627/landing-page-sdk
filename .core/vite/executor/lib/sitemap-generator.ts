import { SiteContext, SitemapOptions } from '@landing-page-sdk/types';
import { isPlainObject, isString, merge } from 'lodash-es';

export default function (siteContext: SiteContext) {
  const { siteOptions, pagesInfo } = siteContext;

  if (!siteOptions.sitemap) {
    return;
  }

  const sitemapOption: Required<SitemapOptions> = {
    baseUrl: '',
    enable: true,
    exclude: [],
    defaults: {},
  };

  if (isString(siteOptions.sitemap)) {
    sitemapOption.baseUrl = siteOptions.sitemap;
  } else if (isPlainObject(siteOptions.sitemap)) {
    merge(sitemapOption, siteOptions.sitemap);
  }

  const { routeMode = 'tree' } = siteOptions;
  const { sites, langInfo } = pagesInfo;
  const { langs } = langInfo;
}
