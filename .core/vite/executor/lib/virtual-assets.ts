import path from 'node:path';
import { isEqual } from 'lodash-es';
import { getProjectPath, readFileAsString } from '@landing-page-sdk/utils-node';

type AssetsInfo = {
  id: string;
  resolveId: string;
  path: string;
  projPath: string;
};

export default class VirtualAssets {
  private static _instance: VirtualAssets;
  private static store: AssetsInfo[] = [];

  private readonly NULL = '\0';
  private readonly PROJ_NAME = '@landing-page-sdk/assets';
  private readonly VR = '/@va';

  constructor() {
    if (!VirtualAssets._instance) VirtualAssets._instance = this;
    return VirtualAssets._instance;
  }

  get(id: string) {
    return VirtualAssets.store.find(
      (item) =>
        item.id === id ||
        item.resolveId === id ||
        item.path === id ||
        item.projPath === id
    );
  }

  id(projPath: string) {
    const info = this.getInfo(projPath);

    if (!info) return;

    return info.id;
  }

  resolveId(projPath: string) {
    const info = this.getInfo(projPath);

    if (!info) return;

    return info.resolveId;
  }

  loadFile(projPath: string) {
    const info = this.getInfo(projPath);

    if (!info) return;

    return readFileAsString(info.path);
  }

  getInfo(projPath: string) {
    const info = this.toInfo(projPath);

    if (!info) return;

    const exists = VirtualAssets.store.find((item) => isEqual(item, info));

    if (!exists) {
      VirtualAssets.store.push(info);
      return info;
    }

    return exists;
  }

  toInfo(projPath: string) {
    if (!projPath.startsWith(this.PROJ_NAME)) return;

    const id = path.join(this.VR, projPath.replace(this.PROJ_NAME, ''));
    const resolveId = this.NULL + id;
    const _path = getProjectPath(projPath);

    return {
      id,
      resolveId,
      path: _path,
      projPath,
    } as AssetsInfo;
  }
}
