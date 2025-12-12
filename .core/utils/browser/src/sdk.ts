import { PageContext } from '@landing-page-sdk/types';
import { $ } from './dom';

export function getPageContext(): PageContext {
  const ctxEl = $('#__SDK_PAGE_CTX__') as HTMLScriptElement;
  const ctx = JSON.parse(ctxEl.textContent) as PageContext;
  return ctx;
}
