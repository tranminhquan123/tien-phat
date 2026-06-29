// src/services/contactService.ts
import { api } from './api';
import type { ContactMessage } from '@/types';

export type PreferredContact = 'PHONE' | 'ZALO' | 'EMAIL';

export type ContactSubmissionPayload = {
  name: string;
  phone: string;
  email?: string;
  message: string;
  inquiryType?: string;
  tileSize?: string;
  area?: string;
  location?: string;
  preferredContact?: PreferredContact;
  preferredTime?: string;
  sourcePage?: string;
  website?: string;
  startedAt?: number;
};

export function submitContact(data: ContactSubmissionPayload) {
  return api.post<{
    success: boolean;
    data: Pick<ContactMessage, 'id' | 'name' | 'phone' | 'email' | 'message' | 'createdAt'>;
    emailSent: boolean;
    message: string;
  }>('/contacts', data);
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

export function adminSendContactTestEmail(email?: string) {
  return api.post<{ success: boolean; message: string }>('/contacts/admin/test-email', { email });
}
