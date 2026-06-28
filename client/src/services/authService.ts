// src/services/authService.ts
import { api } from './api';
import type { AdminUser } from '@/types';

export function loginAdmin(username: string, password: string) {
  return api.post<{ success: boolean; data: { token: string; admin: AdminUser } }>(
    '/auth/login',
    { username, password }
  );
}

export function changePassword(oldPassword: string, newPassword: string) {
  return api.put<{ success: boolean; message: string }>(
    '/auth/change-password',
    { oldPassword, newPassword }
  );
}
