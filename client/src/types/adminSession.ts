export type AdminSessionRole = 'OWNER' | 'MANAGER' | 'STAFF';

export interface AdminSessionProfile {
  id: string;
  username: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: AdminSessionRole;
  isActive?: boolean;
  lastLoginAt?: string | null;
}
