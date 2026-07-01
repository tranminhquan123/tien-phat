import { api } from './api';
import type { TeamMember, TeamRole, TeamStats } from '@/types/teamMember';

export type TeamFilters = {
  search?: string;
  role?: TeamRole;
  status?: 'ACTIVE' | 'INACTIVE';
  page?: number;
  limit?: number;
};

function queryString(filters: TeamFilters) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  const value = query.toString();
  return value ? `?${value}` : '';
}

export function fetchTeam(filters: TeamFilters = {}) {
  return api.get<{
    success: boolean;
    employees: TeamMember[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(`/auth/team${queryString(filters)}`);
}

export function fetchTeamStats() {
  return api.get<{ success: boolean; data: TeamStats }>('/auth/team/stats');
}

export function fetchTeamMember(id: string) {
  return api.get<{ success: boolean; data: TeamMember }>(`/auth/team/${id}`);
}
