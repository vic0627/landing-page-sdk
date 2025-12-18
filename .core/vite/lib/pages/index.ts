import { BuildPageOption, PagesInfo } from '@landing-page-sdk/types';
import initPipe from './pipes/init';
import localizePipe from './pipes/localize';
import diversifyPipe from './pipes/diversify';
import { create as createManifest } from '../common';
import routeFilter from './pipes/route-filter';

export default async function (buildPageOption: BuildPageOption): Promise<PagesInfo> {
  const pages = await initPipe(buildPageOption);
  const langInfo = await localizePipe(buildPageOption, pages);
  const sites = await diversifyPipe(buildPageOption, pages);
  routeFilter(buildPageOption, pages)
  const pagesInfo = { pages, langInfo, sites };

  createManifest(pagesInfo, buildPageOption);

  return { pages, langInfo, sites };
}
