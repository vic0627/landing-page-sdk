import { isString, omitBy } from 'lodash-es';
import { JSDOM } from 'jsdom';
import {
  bundleInlineSync,
  resolve,
  resolveProj,
  readFileAsString,
} from '@landing-page-sdk/utils-node';
import {
  NormalizedControllerOption,
  Page,
  ScriptSourceType,
  SDKPlugin,
} from '@landing-page-sdk/types';
import { getImportStatement, Logger, namedLogger } from '../common';
import chalk from 'chalk';

const name = 'vite-plugin-auto-controller';
let log!: Logger;

export default (({ siteConfig, pagesInfo, cliOption }) => {
  let { controller } = siteConfig;

  if (!controller.length) {
    return;
  }

  log = namedLogger({
    name,
    verbose: cliOption.verbose,
  });

  return {
    name,
    transform(code, id) {
      const entry = findEntryById(pagesInfo.pages, id);
      const opts = matchOptions(controller, 'bundle', entry);

      if (!opts || !entry) {
        return;
      }

      log(logMsg(id, opts));

      return bundleTransform(code, opts);
    },
    transformIndexHtml(code, { path }) {
      const entry = findEntryById(pagesInfo.pages, path);
      const opts = matchOptions(controller, 'inline', entry);

      if (!opts || !entry) {
        return;
      }

      log(logMsg(path, opts));

      return inlineTransform(code, opts, entry);
    },
  };
}) satisfies SDKPlugin;

function logMsg(id: string, opts: NormalizedControllerOption[]) {
  const names = opts
    .map((o) => chalk.green(o.name))
    .reduce((str, name, i, arr) => {
      if (!i) {
        return name;
      }

      const conj = i && arr.length - 1 === i ? 'and ' : '';
      return (str += `, ${conj}${name}`);
    }, '');
  return `Injected controller${opts.length > 1 ? 's' : ''} ${names} into ${chalk.green(id)}`;
}

function toControllerName(name: string) {
  return `@landing-page-sdk/assets/controller/${name}`;
}

function bundleTransform(code: string, opts: NormalizedControllerOption[]) {
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

async function inlineTransform(code: string, opts: NormalizedControllerOption[], entry: Page) {
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
      const filename = resolveProj(toControllerName(name));

      if (injection.bundle) {
        const script = await bundleInlineSync(filename, opt.injection.esbuildOptions, data);
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
  if (
    id.includes('/main.js') ||
    id.includes('/main.ts') ||
    id.includes('/main.jsx') ||
    id.includes('/main.tsx')
  ) {
    id = id.replace(resolve(), '');
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

function matchOptions(stdOpts: NormalizedControllerOption[], type: ScriptSourceType, entry?: Page) {
  if (!entry) return;

  const { route, data } = entry;
  const { lang, site } = data as { lang: string; site: string };

  const matches = stdOpts.filter(({ targets, injection }) => {
    const isTargetRoute = targets.routes.length
      ? isString(route) && targets.routes.includes(route)
      : true;
    const isTargetLang = targets.lang.length ? targets.lang.includes(lang) : true;
    const isTargetSite = targets.site.length ? targets.site.includes(site) : true;
    const isTargetType = injection.type === type;

    return isTargetRoute && isTargetLang && isTargetSite && isTargetType;
  });

  return matches.length ? matches : undefined;
}
