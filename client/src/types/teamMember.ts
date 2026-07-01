export type TeamRole = 'OWNER' | 'MANAGER' | 'STAFF';

export interface TeamMember {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: TeamRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  activeContactCount?: number;
  activeChatCount?: number;
}

export interface TeamStats {
  total: number;
  active: number;
  inactive: number;
  owners: number;
  managers: number;
  staff: number;
  assigned: number;
}
