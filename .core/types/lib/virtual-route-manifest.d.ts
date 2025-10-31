/**
 * 注意：只能在網頁應用的客戶端引入！
 */
declare module 'virtual:route-manifest' {
  const manifest: import('./route').RouteManifest;
  export default manifest;
}
