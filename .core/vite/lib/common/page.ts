import { parse } from 'node:path';
import { merge, omit, pick } from 'lodash-es';
import fg from 'fast-glob';
import { PageContext, PageData, Page as PageEssential, RouteMode } from '@landing-page-sdk/types';
import { base62Hash, join, promiseResolver, resolveProj } from '@landing-page-sdk/utils-node';
import { ALPHA_DASH_UNDERSCORE } from './regexp';

type PageType = 'page' | 'redirect' | 'stub';

interface DiversifyOption {
  filePath: string;
  name: string;
}

interface PageInit {
  // required
  type: PageType;
  routeMode: RouteMode;
  // for 'page'
  template: string;
  relDir: string;
  currentDir: string;
  // for 'stub
  name: string;
  filename: string;
}

const NAME_DELIMITER = ':';

const RESERVED_NAMES = {
  INDEX: 'index',
  REDIRECT: 'redirect',
  STUB: 'stub',
};

const RESERVED_NAMES_ARRAY = Object.values(RESERVED_NAMES);

const emptyObj = <T extends string>(...props: T[]) =>
  props.reduce((o, p) => ((o[p] = ''), o), {} as Record<T, string>);

export const createPage = async (init: Omit<PageInit, 'type' | 'name' | 'filename'>) => {
  const page = new Page({
    type: 'page',
    ...init,
    ...emptyObj('name', 'filename'),
  });
  await page.ready;
  return page;
};

export const createRedirectPage = async (init: Pick<PageInit, 'routeMode'>) => {
  const page = new Page({
    type: 'redirect',
    ...init,
    ...emptyObj('template', 'relDir', 'currentDir', 'name', 'filename'),
  });
  await page.ready;
  return page;
};

export const createStubPage = async (init: Pick<PageInit, 'routeMode' | 'name' | 'filename'>) => {
  const page = new Page({
    type: 'stub',
    ...init,
    ...emptyObj('template', 'relDir', 'currentDir'),
  });
  await page.ready;
  return page;
};

export class Page implements PageEssential {
  // from spec
  private _name: string = '';
  get name() {
    return this._name;
  }

  private _filename: string = '';
  get filename() {
    return this._filename;
  }

  private _rootFilename: string = '';
  get rootFilename() {
    return this._rootFilename;
  }

  private _template: string = '';
  get template() {
    return this._template;
  }

  private _route?: string | undefined;
  get route() {
    return this._route;
  }

  private _entry?: string | undefined;
  get entry() {
    return this._entry;
  }

  private _siteScript?: string | undefined;
  get siteScript() {
    return this._siteScript;
  }

  private _site?: string | undefined;
  get site() {
    return this._site;
  }

  private _lang?: string | undefined;
  get lang() {
    return this._lang;
  }

  private _data?: PageData | undefined;
  get data() {
    return this._data;
  }
  set data(d) {
    this._data = { ...this._data, ...d } as PageData;
    this._data._data = this._data;
  }

  stubFor?: string;

  // internal
  private resolve: () => void;
  private initOptions: PageInit;
  ready: Promise<void>;

  constructor(init: PageInit) {
    this.initOptions = init;
    [this.ready, this.resolve] = promiseResolver<void>();

    if (init.type === 'page') {
      this.initPage();
    } else if (init.type === 'redirect') {
      this.initRedirectPage();
    } else if (init.type === 'stub') {
      this.initStubPage();
    }
  }

  private async initPage() {
    const { template, relDir, currentDir } = this.initOptions;
    const dirs = relDir.split('/');
    const isExplicit = relDir.includes('.');
    const isReserved = dirs.find((dir) => RESERVED_NAMES_ARRAY.includes(dir));

    if (isExplicit) {
      throw new Error(`relative path must not include '.', receive: ${relDir}`);
    }

    if (isReserved) {
      throw new Error(`reserved word '${isReserved}' was found in path: ${relDir}`);
    }

    this._name = relDir ? dirs.join(NAME_DELIMITER) : RESERVED_NAMES.INDEX;
    this._route = relDir ? '/' + relDir : '/';
    this._filename =
      this.initOptions.routeMode === 'tree'
        ? (relDir ? relDir + '/' : '') + 'index.html'
        : (relDir ? relDir.replace(/\//g, '_') : 'index') + '.html';
    this._rootFilename = join('/', this._filename);
    this._template = template;
    this._entry = await this.findEntry(currentDir);

    this.resolve();
  }

  private async findEntry(currentDir: string) {
    const found = await fg(join(currentDir, 'main.{js,ts,jsx,tsx}'))
    const exist = found.length ? found[0] : join(currentDir, 'main.ts?virtual-entry')

    return join('/', exist);
  }

  private initRedirectPage() {
    this._name = RESERVED_NAMES.REDIRECT;
    this._filename = 'index.html';
    this._rootFilename = '/index.html';
    this._template = resolveProj('@landing-page-sdk/assets/redirect/index.html');
    this._entry =
      resolveProj(`@landing-page-sdk/assets/redirect/${this.initOptions.routeMode}.ts`) +
      '?' +
      base62Hash(Math.random().toString(), 6); // add id to let this page appears in manifest.json
    this.resolve();
  }

  private initStubPage() {
    const { name, filename } = this.initOptions;

    this._name = `${name}${NAME_DELIMITER}${RESERVED_NAMES.STUB}`;
    this._filename = filename;
    this._rootFilename = join('/', filename);
    this._template = resolveProj('@landing-page-sdk/assets/redirect/stub.html');
    this._entry =
      resolveProj('@landing-page-sdk/assets/redirect/stub.ts') +
      '?' +
      base62Hash(Math.random().toString(), 6); // add id to let this page appears in manifest.json
    this.stubFor = join('/', name.replace(NAME_DELIMITER, '/'));
    this.resolve();
  }

  async clone() {
    const newPage = new Page(this.initOptions);
    newPage.data = this._data;
    await newPage.ready;
    return newPage;
  }

  localize(lang: string, langs: string[]) {
    const isMultiLang = langs.length > 1;

    this._name = isMultiLang ? `${lang}:${this._name}` : this._name;
    this._lang = lang;

    if (this.initOptions.routeMode === 'tree') {
      this._filename = isMultiLang ? join(lang, this._rootFilename) : this._filename;
      this._rootFilename = join('/', lang, this._rootFilename);
    } else {
      const { name, ext } = parse(this._filename);
      const newName = `${name}_${lang}`;
      this._filename = isMultiLang
        ? this._filename.replace(`${name}${ext}`, `${newName}${ext}`)
        : this._filename;
      this._rootFilename = join('/', this._filename);
    }

    if (this._entry) {
      this._entry += `${this._entry.includes('?') ? '&' : '?'}lang=${lang}`;
    }
  }

  diversify(options: DiversifyOption) {
    const { filePath, name } = options;

    if (!ALPHA_DASH_UNDERSCORE.test(name)) {
      throw new Error(`Invalid site name: ${name}`);
    }

    this._filename = `${name}/${this._filename}`;
    this._name = `${name}${NAME_DELIMITER}${this._name}`;
    this._site = name;

    const redirectPage = this._name.endsWith('redirect');
    const stubPage = this._name.endsWith('stub');

    if (this._entry && !redirectPage && !stubPage) {
      this._siteScript = join(process.cwd(), filePath);

      if (this._entry) {
        this._entry += `${this._entry.includes('?') ? '&' : '?'}site=${name}`;
      }
    }
  }

  isStub() {
    return this.initOptions.type === 'stub';
  }

  getContext() {
    return merge(
      pick(this, 'name', 'filename', 'rootFilename', 'route', 'lang', 'site'),
      omit(this.data, '_data', '$cmp', 'env', 'filename')
    ) as PageContext;
  }
}
