export * from './api';
export * from './auth';

export type Theme = 'light' | 'dark' | 'system';

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
}
