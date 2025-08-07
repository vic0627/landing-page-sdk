// import { type Page as _Page } from 'vite-plugin-virtual-mpa';

export interface Page {
  name: string;
  filename: string;
  template: string;
  entry?: string;
  data: Record<string, any>;
}
