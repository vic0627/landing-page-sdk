/**
 * 注意：只能在網頁應用的客戶端引入！
 * @deprecated
 */
declare module 'virtual:redirect-manifest' {
  const manifest: import('./route').RedirectManifest;
  export default manifest;
}
