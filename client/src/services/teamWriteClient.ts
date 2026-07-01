import { api } from './api';
import type { TeamMember, TeamRole } from '@/types/teamMember';

export type TeamMemberInput = {
  name: string;
  username: string;
  email?: string | null;
  phone?: string | null;
  role: TeamRole;
  password?: string;
  isActive?: boolean;
};

export function addTeamMember(data: TeamMemberInput) {
  return api.post<{ success: boolean; data: TeamMember }>('/auth/team', data);
}

export function saveTeamMember(id: string, data: Partial<TeamMemberInput>) {
  return api.put<{ success: boolean; data: TeamMember }>(`/auth/team/${id}`, data);
}
