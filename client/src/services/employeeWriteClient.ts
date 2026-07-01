import { api } from './api';
import type { TeamMemberInput } from './teamWriteClient';
import type { TeamMember } from '@/types/teamMember';

export function createEmployee(data: TeamMemberInput) {
  return api.post<{ success: boolean; data: TeamMember }>('/admin/employees', data);
}

export function updateEmployee(id: string, data: Partial<TeamMemberInput>) {
  return api.put<{ success: boolean; data: TeamMember }>(`/admin/employees/${id}`, data);
}

export function updateEmployeeStatus(id: string, reassignToAdminId?: string | null) {
  return api.put<{ success: boolean; data: TeamMember }>(`/auth/team/${id}/status`, {
    reassignToAdminId: reassignToAdminId || null,
  });
}
