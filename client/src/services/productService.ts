// src/services/productService.ts
import { api } from './api';
import type { Product, PaginatedResponse } from '@/types';

interface ProductListResponse extends PaginatedResponse<Product> {
  products: Product[];
}

interface ProductDetailResponse {
  success: boolean;
  data: {
    product: Product;
    related: Product[];
  };
}

export function getProducts(params: {
  category?: string;
  size?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
} = {}) {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.size) qs.set('size', params.size);
  if (params.search) qs.set('search', params.search);
  if (params.featured) qs.set('featured', 'true');
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));

  const query = qs.toString();
  return api.get<ProductListResponse>(`/products${query ? `?${query}` : ''}`);
}

export async function getProductBySlug(slug: string) {
  const response = await api.get<ProductDetailResponse>(`/products/${slug}`);
  const category = response.data.product.category;

  return {
    ...response,
    data: {
      ...response.data,
      related: (response.data.related ?? []).map((product) => ({
        ...product,
        category: product.category ?? category,
        images: Array.isArray(product.images) ? product.images : [],
      })),
    },
  };
}

// Admin
export function adminGetProducts(params: {
  search?: string;
  categoryId?: string;
  size?: string;
  page?: number;
} = {}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.categoryId) qs.set('categoryId', params.categoryId);
  if (params.size) qs.set('size', params.size);
  if (params.page) qs.set('page', String(params.page));
  return api.get<ProductListResponse>(`/products/admin/list?${qs.toString()}`);
}

export function adminCreateProduct(data: Omit<Partial<Product>, 'images'> & {
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
