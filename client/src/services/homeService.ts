import { api } from './api';
import type { Banner, Category, Product } from '@/types';

export type HomepageData = {
  banners: Banner[];
  categories: Category[];
  featured: Product[];
};

export function getHomepageData() {
  return api.getCached<{ success: boolean; data: HomepageData }>('/home', 60_000);
}
