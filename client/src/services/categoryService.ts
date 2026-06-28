// src/services/categoryService.ts
import { api } from './api';
import type { Category } from '@/types';

export function getCategories(activeOnly = false) {
  return api.get<{ success: boolean; data: Category[] }>(
    `/categories${activeOnly ? '?activeOnly=true' : ''}`
  );
}

export function adminCreateCategory(data: Partial<Category>) {
  return api.post<{ success: boolean; data: Category }>('/categories/admin', data);
}

export function adminUpdateCategory(id: string, data: Partial<Category>) {
  return api.put<{ success: boolean; data: Category }>(`/categories/admin/${id}`, data);
}

export function adminDeleteCategory(id: string) {
  return api.delete<{ success: boolean }>(`/categories/admin/${id}`);
}
