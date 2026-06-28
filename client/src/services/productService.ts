// src/services/productService.ts
import { api } from './api';
import type { Product, PaginatedResponse } from '@/types';

interface ProductListResponse extends PaginatedResponse<Product> {
  products: Product[];
}

export function getProducts(params: {
  category?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
} = {}) {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.search) qs.set('search', params.search);
  if (params.featured) qs.set('featured', 'true');
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const query = qs.toString();
  return api.get<ProductListResponse>(`/products${query ? `?${query}` : ''}`);
}

export function getProductBySlug(slug: string) {
  return api.get<{ success: boolean; data: { product: Product; related: Product[] } }>(
    `/products/${slug}`
  );
}

// Admin
export function adminGetProducts(params: { search?: string; categoryId?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  if (params.page) qs.set('page', String(params.page));
  return api.get<ProductListResponse>(`/products/admin/list?${qs.toString()}`);
}

export function adminCreateProduct(data: Partial<Product> & {
  images?: Array<{
    url: string;
    altText?: string;
    isPrimary?: boolean;
    sortOrder?: number;
  }>;
}) {
  return api.post<{ success: boolean; data: Product }>('/products/admin', data);
}

export function adminUpdateProduct(id: string, data: Partial<Product>) {
  return api.put<{ success: boolean; data: Product }>(`/products/admin/${id}`, data);
}

export function adminDeleteProduct(id: string) {
  return api.delete<{ success: boolean }>(`/products/admin/${id}`);
}
