import { getAllCategories } from '@/services/categoryService';
import { getBanners } from '@/services/configService';
import { getPublicProducts } from '@/services/productService';

const HOME_CACHE_MS = 60_000;

let homeCache: {
  expiresAt: number;
  data: Awaited<ReturnType<typeof loadHomeData>>;
} | null = null;

async function loadHomeData() {
  const [banners, categories, featuredResult] = await Promise.all([
    getBanners(true),
    getAllCategories(true),
    getPublicProducts({ featured: true, limit: 8 }),
  ]);

  return {
    banners,
    categories,
    featured: featuredResult.products,
  };
}

export async function getHomeData() {
  if (homeCache && homeCache.expiresAt > Date.now()) {
    return homeCache.data;
  }

  const data = await loadHomeData();
  homeCache = {
    expiresAt: Date.now() + HOME_CACHE_MS,
    data,
  };
  return data;
}
