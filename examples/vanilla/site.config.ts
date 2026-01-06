import type { SiteConfig } from '@landing-page-sdk/types';
import tailwindcss from '@tailwindcss/vite';

export default {
  plugins: [tailwindcss()],
  redirect: {
    stub: true,
    transform(page) {
      const { route, lang } = page;
      const { document } = this;
      const titleText = `Redirecting${route ? `: ${route}` : ''}`;
      const descriptionText = `Redirecting to ${route || '/'}${lang ? ` (${lang})` : ''}.`;
      const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
        let el = document.querySelector(`meta[${attr}="${key}"]`);
        if (!el) {
          el = document.createElement('meta');
          el.setAttribute(attr, key);
          document.head.appendChild(el);
        }
        el.setAttribute('content', content);
      };

      let titleEl = document.querySelector('title');
      if (!titleEl) {
        titleEl = document.createElement('title');
        document.head.appendChild(titleEl);
      }
      titleEl.textContent = titleText;

      setMeta('name', 'description', descriptionText);
      setMeta('property', 'og:title', titleText);
      setMeta('property', 'og:description', descriptionText);
      setMeta('property', 'og:type', 'website');
      setMeta('name', 'twitter:card', 'summary');
      setMeta('name', 'twitter:title', titleText);
      setMeta('name', 'twitter:description', descriptionText);
    },
  },
} satisfies SiteConfig;
