import { createHash } from 'node:crypto';

export function base62Hash(seed: string, len?: number) {
  return createHash('sha256')
    .update(seed)
    .digest('base64')
    .replace(/[+/=]/g, '')
    .slice(0, len);
}
