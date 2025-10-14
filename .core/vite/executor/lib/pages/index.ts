import { BuildPageOption, PagesInfo } from '@landing-page-sdk/types';
import initPipe from './pipes/init';
import localizePipe from './pipes/localize';
import diversifyPipe from './pipes/diversify';

export default function (buildPageOption: BuildPageOption): PagesInfo {
  const pages = initPipe(buildPageOption);
  const langInfo = localizePipe(buildPageOption, pages);
  const sites = diversifyPipe(buildPageOption, pages);

  return { pages, langInfo, sites };
}
