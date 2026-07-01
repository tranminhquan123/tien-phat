import { api } from './api';
import type { AdminUser } from '@/types';
import type {
  ContactPriority,
  ContactSource,
  ContactStatus,
  CrmContact,
  CrmContactDetail,
  CrmStats,
} from '@/types/crm';

export type CrmListParams = {
  status?: ContactStatus;
  priority?: ContactPriority;
  source?: ContactSource;
  assignedAdminId?: string;
  followUp?: 'TODAY' | 'OVERDUE' | 'UPCOMING' | 'NONE';
  search?: string;
  page?: number;
  limit?: number;
};

export type CrmUpdatePayload = {
  status?: ContactStatus;
  priority?: ContactPriority;
  source?: ContactSource;
  assignedAdminId?: string | null;
  followUpAt?: string | null;
  lastContactAt?: string | null;
  note?: string | null;
  aiSummary?: string | null;
  leadScore?: number | null;
  extractedRequirements?: Record<string, unknown> | null;
};

export function getCrmContacts(params: CrmListParams = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const qs = query.toString();
  return api.get<{
    success: boolean;
    messages: CrmContact[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/contacts/admin${qs ? `?${qs}` : ''}`);
}

export function getCrmContact(id: string) {
  return api.get<{ success: boolean; data: CrmContactDetail }>(`/contacts/admin/${id}`);
}

export function updateCrmContact(id: string, data: CrmUpdatePayload) {
  return api.put<{ success: boolean; data: CrmContact }>(`/contacts/admin/${id}`, data);
}

export function getCrmStats() {
  return api.get<{ success: boolean; data: CrmStats }>('/contacts/admin/stats');
}

export function getCrmOptions() {
  return api.get<{ success: boolean; data: { admins: AdminUser[] } }>('/contacts/admin/options');
}
