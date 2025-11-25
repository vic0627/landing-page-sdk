import { RouteManifest, RouteMapKey, RouteResolveOption } from '@landing-page-sdk/types';

export function manifestResolver(manifest: RouteManifest, option: RouteResolveOption): string {
  const mapKey = manifest.meta.keyOrder
    .map((k) => {
      const label = k === 'site' ? 'site' : k.includes('Locale') ? 'locale' : 'route';
      const value = option[k];

      if (!value) {
        return -1;
      }

      const arr = manifest.dict[label];
      const i = arr.indexOf(value);
      return i;
    })
    .join() as RouteMapKey;

  const href = manifest.map[mapKey];

  if (!href) {
    throw new Error(`undefined destination for ${JSON.stringify(option)}`);
  }

  return href;
}
