import {
  isArray,
  isBoolean,
  isPlainObject,
  isString,
  isUndefined,
  omitBy,
} from 'lodash-es';
import { JSDOM } from 'jsdom';
import {
  bundleInlineSync,
  getPath,
  getProjectPath,
  readFileAsString,
} from '@landing-page-sdk/utils-node';
import {
  ControllerInjection,
  ControllerOption,
  ControllerTarget,
  Page,
  ScriptSourceType,
  SDKPlugin,
  StandardControllerOption,
} from '@landing-page-sdk/types';
import { getImportStatement, Logger, namedLogger } from '../common';
import chalk from 'chalk';

const name = 'vite-plugin-auto-controller';
let log!: Logger;

export default (({ siteOptions, pagesInfo, cliOptions }) => {
  let { controller } = siteOptions;

  if (!controller) {
    return;
  }

  let controllers!: StandardControllerOption[];
  log = namedLogger({
    name,
    verbose: cliOptions.verbose,
  });

  if (isPlainObject(controller)) {
    controllers = [standardizeOption(controller as ControllerOption)];
  } else if (isArray(controller)) {
    controllers = controller.map(standardizeOption);
  } else {
    throw new TypeError(`'controller' only accept plain object or array`);
  }

  return {
    name,
    transform(code, id) {
      const entry = findEntryById(pagesInfo.pages, id);
      const opts = matchOptions(controllers, 'bundle', entry);

      if (!opts || !entry) {
        return;
      }

      log(logMsg(id, opts));

      return bundleTransform(code, opts);
    },
    transformIndexHtml(code, { path }) {
      const entry = findEntryById(pagesInfo.pages, path);
      const opts = matchOptions(controllers, 'inline', entry);

      if (!opts || !entry) {
        return;
      }

      log(logMsg(path, opts));

      return inlineTransform(code, opts, entry);
    },
  };
}) satisfies SDKPlugin;

function logMsg(id: string, opts: StandardControllerOption[]) {
  const names = opts
    .map((o) => chalk.green(o.name))
    .reduce((str, name, i, arr) => {
      if (!i) {
        return name;
      }

      const conj = i && arr.length - 1 === i ? 'and ' : '';
      return (str += `, ${conj}${name}`);
    }, '');
  return `Injected controller${
    opts.length > 1 ? 's' : ''
  } ${names} into ${chalk.green(id)}`;
}

function toControllerName(name: string) {
  return `@landing-page-sdk/assets/controller/${name}`;
}

function bundleTransform(code: string, opts: StandardControllerOption[]) {
  for (const { name, injection } of opts) {
    const { placement } = injection;
    const importStatement = getImportStatement(toControllerName(name));

    if (placement === 'pre') {
      code = importStatement + code;
    } else {
      code += importStatement;
    }
  }

  return code;
}

const scriptMap = new Map<string, string>();

async function inlineTransform(
  code: string,
  opts: StandardControllerOption[],
  entry: Page
) {
  const vm = new JSDOM(code);
  const data = omitBy(entry.data, (v) => {
    try {
      return !JSON.stringify(v);
    } catch {
      return true;
    }
  });

  for (const opt of opts) {
    const { name, injection } = opt;
    const id = btoa(JSON.stringify(opt));

    if (!scriptMap.has(id)) {
      const filename = getProjectPath(toControllerName(name));

      if (injection.bundle) {
        const script = await bundleInlineSync(filename, data);
        const file = script.outputFiles[0];
        scriptMap.set(id, file.text);
      } else {
        scriptMap.set(id, readFileAsString(filename));
      }
    }

    const scriptText = scriptMap.get(id) as string;
    const script = vm.window.document.createElement('script');
    script.setAttribute('type', 'text/javascript');
    script.textContent = scriptText;

    const container = vm.window.document.querySelector(injection.appendTo)!;

    if (injection.placement === 'pre') {
      container.prepend(script);
    } else {
      container.append(script);
    }
  }

  return vm.serialize();
}

function findEntryById(pages: Page[], id: string) {
  let entryInfo: Page | undefined;
  if (id.includes('/main.js')) {
    id = id.replace(getPath(), '');
    entryInfo = pages.find((p) => p.entry === id);
  } else if (id.includes('.html')) {
    id = id.slice(1);
    entryInfo = pages.find((p) => p.filename === id);
  }

  if (entryInfo?.name.includes('redirect')) {
    entryInfo = undefined;
  }

  return entryInfo;
}

function matchOptions(
  stdOpts: StandardControllerOption[],
  type: ScriptSourceType,
  entry?: Page
) {
  if (!entry) return;

  const { route, data } = entry;
  const { lang, site } = data as { lang: string; site: string };

  const matches = stdOpts.filter(({ targets, injection }) => {
    const isTargetRoute = isString(route) && targets.routes.includes(route);
    const isTargetLang = targets.lang.length
      ? targets.lang.includes(lang)
      : true;
    const isTargetSite = targets.site.length
      ? targets.site.includes(site)
      : true;
    const isTargetType = injection.type === type;

    return isTargetRoute && isTargetLang && isTargetSite && isTargetType;
  });

  return matches.length ? matches : undefined;
}

function standardizeOption(opt: ControllerOption) {
  const stdOpt: StandardControllerOption = {
    name: opt.name,
    targets: {
      routes: [],
      lang: [],
      site: [],
    },
    injection: {
      type: 'bundle',
      appendTo: 'head',
      placement: 'post',
      bundle: true,
    },
  };

  // targets
  if (isUndefined(opt.targets)) {
    stdOpt.targets.routes.push('/');
  } else if (isString(opt.targets)) {
    stdOpt.targets.routes.push(opt.targets);
  } else if (isArray(opt.targets)) {
    stdOpt.targets.routes.push(...opt.targets);
  } else if (isPlainObject(opt.targets)) {
    const optTargets = opt.targets as ControllerTarget;

    // targets.routes
    if (isString(optTargets.routes)) {
      stdOpt.targets.routes.push(optTargets.routes);
    } else if (isArray(optTargets.routes)) {
      stdOpt.targets.routes.push(...optTargets.routes);
    }

    // targets.lang
    if (isString(optTargets.lang)) {
      stdOpt.targets.lang.push(optTargets.lang);
    } else if (isArray(optTargets.lang)) {
      stdOpt.targets.lang.push(...optTargets.lang);
    }

    // targets.site
    if (isString(optTargets.site)) {
      stdOpt.targets.site.push(optTargets.site);
    } else if (isArray(optTargets.site)) {
      stdOpt.targets.site.push(...optTargets.site);
    }
  }

  // injection
  if (isString(opt.injection)) {
    stdOpt.injection.type = opt.injection;
  } else if (isPlainObject(opt.injection)) {
    const optInjection = opt.injection as ControllerInjection;

    if (isString(optInjection.type)) {
      stdOpt.injection.type = optInjection.type;
    }

    if (isString(optInjection.appendTo)) {
      stdOpt.injection.appendTo = optInjection.appendTo;
    }

    if (isString(optInjection.placement)) {
      stdOpt.injection.placement = optInjection.placement;
    }

    if (isBoolean(optInjection.bundle)) {
      stdOpt.injection.bundle = optInjection.bundle;
    }
  }

  return stdOpt;
}
