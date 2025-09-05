/** @type {import('@landing-page-sdk/types').SiteOptions} */
export default {
  routeMode: 'tree',
  enableStubRedirect: true,
  assets: 'rel',
  env: {
    defaultLang: 'zh-TW',
  },
  threshold: 5 * 1024,
  transformRedirect() {
    const metaRobots = this.document.createElement('meta');
    metaRobots.setAttribute('name', 'robots');
    metaRobots.setAttribute('content', 'noindex');
    const title = this.document.createElement('title');
    title.textContent = 'Site Dev Demo';
    const head = this.document.querySelector('head');
    head?.append(metaRobots, title);
  },
  controller: {
    name: 'mount-download-urls.ts',
    targets: {
      routes: '/',
      lang: 'zh-TW',
      site: 'site-a',
    },
    injection: 'inline',
  },
};
