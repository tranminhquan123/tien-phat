// src/types/index.ts
import type { Request } from 'express';

export interface AuthRequest extends Request {
  adminId?: string;
  adminUsername?: string;
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

// Định nghĩa enum thủ công để không phụ thuộc prisma generate
export type ContactMessageStatus = 'NEW' | 'READING' | 'REPLIED' | 'CLOSED';
