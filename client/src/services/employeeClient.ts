import { api } from './api';
import type { TeamMember, TeamRole, TeamStats } from '@/types/teamMember';

export type EmployeeFilters = {
  search?: string;
  role?: TeamRole;
  status?: 'ACTIVE' | 'INACTIVE';
  page?: number;
  limit?: number;
};

function buildQuery(filters: EmployeeFilters) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const suffix = query.toString();
  return suffix ? `?${suffix}` : '';
}

export function getEmployees(filters: EmployeeFilters = {}) {
  return api.get<{
    success: boolean;
    employees: TeamMember[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/admin/employees${buildQuery(filters)}`);
}

export function getEmployeeStats() {
  return api.get<{ success: boolean; data: TeamStats }>('/admin/employees/stats');
}

export function getEmployee(id: string) {
  return api.get<{ success: boolean; data: TeamMember }>(`/admin/employees/${id}`);
}
