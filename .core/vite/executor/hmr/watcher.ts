import { parse } from 'node:path';
import { FSWatcher, Matcher, watch } from 'chokidar';
import { EventName } from 'chokidar/handler.js';

type Listener = (evt: EventName, path: string) => void;

type Watcher = {
  vm: FSWatcher;
  evt: EventName[];
};

type SetWatcherOption = Partial<
  Pick<Watcher, 'evt'> & {
    matcher: Matcher;
  }
>;

const watchers = new Set<Watcher>();

const set = async (path: string, option?: SetWatcherOption) => {
  const { evt = ['all'], matcher } = option ?? {};
  const ignored: Matcher[] = [(path) => /\s/.test(parse(path).name)];

  if (matcher) {
    ignored.push(matcher);
  }

  const vm = watch(path, {
    ignoreInitial: true,
    persistent: true,
    ignored,
  });
  watchers.add({ vm, evt });
};

const on = (listener: Listener) => {
  watchers.forEach(({ vm, evt }) => {
    vm.on('all', (e, p) => {
      if (evt.includes('all') || evt.includes(e)) listener(e, p);
    });
  });
};

const destroy = async () => {
  const iterator = watchers.values();

  let watcher: Watcher | undefined;

  while ((watcher = iterator.next().value)) {
    await watcher.vm.close();
  }

  watchers.clear();
};

type FileMatcherOption = {
  ext: string[];
  name?: string;
};

const createFileMatcher = (...options: FileMatcherOption[]): Extract<Matcher, Function> => {
  if (!options.length) {
    return () => false;
  }

  return (path, stats) => {
    const isFile = stats?.isFile() as boolean;
    const { name, ext } = parse(path);
    const matchFile = options.some(({ ext: _ext, name: _name }) => {
      const matchName = _name ? _name === name : true;
      const matchExt = _ext.includes(ext);
      return matchName && matchExt;
    });

    return isFile && !matchFile;
  };
};

export { set, on, destroy, createFileMatcher };
