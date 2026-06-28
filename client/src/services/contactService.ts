// src/services/contactService.ts
import { api } from './api';
import type { ContactMessage } from '@/types';

export function submitContact(data: { name: string; phone: string; email?: string; message: string }) {
  return api.post<{ success: boolean; message: string }>('/contacts', data);
}

export function adminGetContacts(params: { status?: string; page?: number } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', String(params.page));
  return api.get<{ success: boolean; messages: ContactMessage[]; total: number; totalPages: number }>(
    `/contacts/admin?${qs.toString()}`
  );
}

export function adminUpdateContact(id: string, data: { status: string; note?: string }) {
  return api.put<{ success: boolean; data: ContactMessage }>(`/contacts/admin/${id}`, data);
}

export function adminGetContactStats() {
  return api.get<{ success: boolean; data: { total: number; new: number; replied: number } }>(
    '/contacts/admin/stats'
  );
}
