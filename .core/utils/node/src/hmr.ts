import { createRequire } from 'node:module';
import { sep } from 'node:path';

const require = createRequire(import.meta.url);
const isNodeModules = (p: string) => p.includes(`${sep}node_modules${sep}`);

function purgeTree(entryAbs: string, seen = new Set<string>()) {
  const mod = require.cache[entryAbs];
  if (!mod || seen.has(entryAbs)) return;
  seen.add(entryAbs);

  for (const child of mod.children) {
    if (!isNodeModules(child.id)) {
      purgeTree(child.id, seen);
    }
  }
  delete require.cache[entryAbs];
}

export function loadHMR<MOD>(specifier: string): MOD | undefined {
  try {
    // 解析到實檔（ts/tsx/js都可以，pirates 會接手轉譯）
    const abs = require.resolve(specifier);
    // 砍掉 CJS 快取
    purgeTree(abs);
    // 重新載入
    return require(abs);
  } catch (error) {
    console.error(error);
    return;
  }
}
