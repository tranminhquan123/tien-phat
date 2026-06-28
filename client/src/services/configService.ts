// src/services/configService.ts
import { api } from './api';
import type { SiteConfig, Banner } from '@/types';

export function getSiteConfig() {
  return api.get<{ success: boolean; data: SiteConfig }>('/config');
}

export function getBanners(activeOnly = false) {
  return api.get<{ success: boolean; data: Banner[] }>(
    `/config/banners${activeOnly ? '?activeOnly=true' : ''}`
  );
}

export function adminUpdateConfig(data: Partial<SiteConfig>) {
  return api.put<{ success: boolean; data: SiteConfig }>('/config/admin', data);
}
