# 9. CLI / Nx Reference

All SDK tasks are exposed as Nx targets, so you always run them through `npx nx`. This keeps behavior consistent across projects and lets you pass options in a predictable way.

### Targets in this workspace

The example projects expose three primary targets:

```bash
npx nx dev @landing-page-sdk/examples-vue
npx nx build @landing-page-sdk/examples-vue
npx nx preview @landing-page-sdk/examples-vue
```

The same targets exist for `@landing-page-sdk/examples-vanilla`.

You can also use the explicit form:

```bash
npx nx run @landing-page-sdk/examples-vue:dev
```

### Executor options (`@landing-page-sdk/core:vite`)

The targets above map to the `@landing-page-sdk/core:vite` executor. Options are passed directly to the target:

```bash
npx nx dev @landing-page-sdk/examples-vue --host --port=8080 --sites=site-a,site-b
```

Options:
- `--host`: host for the dev server. Accepts `true` or a host string.
- `--port`: port for the dev or preview server.
- `--sites`: generate specific site variants (comma-separated).
- `--config`: custom `site.config` path.
- `--verbose`: print verbose logs (executor, Vite plugins, mock middleware).

Notes:
- `dev`, `build`, and `preview` are all the same executor with different `mode` values under the hood.
- `--sites` applies to build and preview as well, so you can focus on a subset of variants.
