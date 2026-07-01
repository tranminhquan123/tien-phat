import type { Request } from 'express';

export type AdminRole = 'OWNER' | 'MANAGER' | 'STAFF';

export interface AuthRequest extends Request {
  adminId?: string;
  adminUsername?: string;
  adminRole?: AdminRole;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ContactMessageStatus =
  | 'NEW'
  | 'READING'
  | 'RECEIVED'
  | 'CONSULTING'
  | 'WAITING_CUSTOMER'
  | 'QUOTED'
  | 'WON'
  | 'LOST'
  | 'REPLIED'
  | 'CLOSED';
