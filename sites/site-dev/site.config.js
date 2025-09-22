/** @type {import('@landing-page-sdk/types').SiteOptions} */
export default {
  routeMode: 'tree',
  output: {
    minify: false,
    assets: 'rel',
    threshold: 5 * 1024,
    versioning: 'soft',
  },
  env: {
    defaultLang: 'zh-TW',
  },
  redirect: {
    enable: false,
    transform() {
      const metaRobots = this.document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      metaRobots.setAttribute('content', 'noindex');
      const title = this.document.createElement('title');
      title.textContent = 'Site Dev Demo';
      const head = this.document.querySelector('head');
      head?.append(metaRobots, title);
    },
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
  sitemap: {
    baseUrl: {
      default: 'https://www.example.com',
      'site-a': 'https://www.example2.com',
    },
    orientation: 'dir',
    exclude: [/^\/en\/.*$/],
    defaults: {
      changefreq: 'monthly',
      priority: 0.8,
    },
  },
};
