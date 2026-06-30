// src/services/configService.ts
import { api } from './api';
import type { SiteConfig, Banner } from '@/types';

export function getSiteConfig() {
  return api.getCached<{ success: boolean; data: SiteConfig }>('/config', 5 * 60_000);
}

export function getBanners(activeOnly = false) {
  const path = `/config/banners${activeOnly ? '?activeOnly=true' : ''}`;
  return api.getCached<{ success: boolean; data: Banner[] }>(path, 5 * 60_000);
}

export function adminUpdateConfig(data: Partial<SiteConfig>) {
  return api.put<{ success: boolean; data: SiteConfig }>('/config/admin', data);
}
