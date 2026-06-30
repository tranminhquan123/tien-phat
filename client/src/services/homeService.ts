import { api } from './api';
import { getCategories } from './categoryService';
import { getBanners } from './configService';
import { getProducts } from './productService';
import type { Banner, Category, Product } from '@/types';

export type HomepageData = {
  banners: Banner[];
  categories: Category[];
  featured: Product[];
};

export async function getHomepageData() {
  try {
    return await api.getCached<{ success: boolean; data: HomepageData }>('/home', 60_000);
  } catch {
    // Giữ website hoạt động nếu frontend được deploy trước backend mới.
    const [bannerResponse, categoryResponse, productResponse] = await Promise.all([
      getBanners(true),
      getCategories(true),
      getProducts({ featured: true, limit: 8 }),
    ]);

    return {
      success: true,
      data: {
        banners: bannerResponse.data ?? [],
        categories: categoryResponse.data ?? [],
        featured: productResponse.products ?? [],
      },
    };
  }
}
