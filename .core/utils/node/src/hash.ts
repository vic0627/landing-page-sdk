// Base62：0-9, A-Z, a-z
const B62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function timestampHash(length = 8) {
  let h = 0x811c9dc5; // FNV offset basis
  const s = String(Date.now());
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    // 32-bit
    h = (h * 0x01000193) >>> 0;
  }
  h ^= h >>> 16;

  let out = '';
  let x = h >>> 0;
  for (let i = 0; i < length; i++) {
    out = B62[x % 62] + out;
    x = Math.floor(x / 62) || (x * 2654435761) >>> 0;
  }
  return out.slice(-6);
}
