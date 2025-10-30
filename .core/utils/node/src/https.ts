import https from 'node:https';

export function getPkgVersion(pkg: string) {
  return new Promise<string>((resolve, reject) => {
    https
      .get(`https://registry.npmjs.org/${pkg}/latest`, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve(JSON.parse(data).version));
      })
      .on('error', reject);
  });
}
