import * as esbuild from 'esbuild';

const MOD_ID = 'virtual:data-inject';

function dataInjectPlugin(data: Record<string, any> = {}) {
  return {
    name: 'data-inject',
    setup(build: esbuild.PluginBuild) {
      // 解析假路徑
      build.onResolve({ filter: new RegExp(`^${MOD_ID}$`) }, () => ({
        path: MOD_ID,
        namespace: 'data',
      }));

      // 產出虛擬模組內容
      build.onLoad({ filter: /.*/, namespace: 'data' }, () => {
        // const toIdent = (k: string) =>
        //   /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(k) ? k : JSON.stringify(k);

        const lines: string[] = [];

        // 個別匯出（可被 tree-shake）
        for (const [k, v] of Object.entries(data)) {
          // const ident = toIdent(k);
          lines.push(`export var ${k} = ${JSON.stringify(v)};`);
        }

        return { contents: lines.join('\n'), loader: 'js' };
      });
    },
  } as esbuild.Plugin;
}

export const bundleInlineSync = (path: string, data?: Record<string, any>) =>
  esbuild.build({
    entryPoints: [path],
    bundle: true,
    minify: true,
    write: false,
    platform: 'browser',
    target: 'ie11',
    plugins: data ? [dataInjectPlugin(data)] : [],
    // 讓每個模組都能「看見」那些 export（只有用到的才會保留）
    inject: data ? [MOD_ID] : [],
  });
