import { isArray, isRegExp, isString } from 'lodash-es';
import { BuildPageOption, RouteHiddenRule } from '@landing-page-sdk/types';
import { Page, namedLogger } from '../../common';

export default function (buildPageOption: BuildPageOption, pages: Page[]) {
  const hiddenRules = buildPageOption.cfg.route.hidden;

  if (!hiddenRules.length) {
    return;
  }

  const log = namedLogger({
    name: 'route-filter',
    verbose: buildPageOption.cli.verbose,
  });

  const originalPages = [...pages];
  pages.length = 0;

  for (const page of originalPages) {
    const matchedRule = hiddenRules.find((rule) => isHiddenPage(rule, page));

    if (!matchedRule) {
      pages.push(page);
      continue;
    }

    log(`hide ${page.filename}${matchedRule.reason ? `, reason: ${matchedRule.reason}` : ''}`);
  }
}

function isHiddenPage(rule: RouteHiddenRule, page: Page) {
  const { route, site, lang } = rule;

  let isHiddenRoute = false;
  const pageRoute = page.route ?? page.stubFor;

  if (!pageRoute) {
    return false;
  }

  if (isString(route)) {
    isHiddenRoute = pageRoute === route;
  } else if (isRegExp(route)) {
    isHiddenRoute = route.test(pageRoute);
  } else if (isArray(route)) {
    isHiddenRoute = route.some((r) => {
      if (isString(r)) {
        return pageRoute === r;
      } else if (isRegExp(r)) {
        return r.test(pageRoute);
      } else {
        return false;
      }
    });
  }

  if (!isHiddenRoute) {
    return false;
  }

  if (site) {
    if (!page.site) {
      return false;
    }

    if (isString(site) && site !== page.site) {
      return false;
    }

    if (isArray(site) && !site.includes(page.site)) {
      return false;
    }
  }

  if (lang) {
    if (!page.lang) {
      return false;
    }

    if (isString(lang) && lang !== page.lang) {
      return false;
    }

    if (isArray(lang) && !lang.includes(page.lang)) {
      return false;
    }
  }

  return true;
}
