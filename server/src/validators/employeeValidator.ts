import { z } from 'zod';

export const adminRoleSchema = z.enum(['OWNER', 'MANAGER', 'STAFF']);

const optionalEmail = z.union([
  z.string().trim().email().max(160),
  z.literal(''),
  z.null(),
]).optional().transform((value) => value || null);

const optionalPhone = z.union([
  z.string().trim().max(20),
  z.literal(''),
  z.null(),
]).optional().transform((value) => value || null);

export const employeeListQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  role: adminRoleSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  page: z.coerce.number().int().positive().max(100000).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(2).max(100),
  username: z.string().trim().min(4).max(30).regex(/^[a-zA-Z0-9._-]+$/).transform((value) => value.toLowerCase()),
  email: optionalEmail,
  phone: optionalPhone,
  role: adminRoleSchema.default('STAFF'),
  password: z.string().min(8).max(72),
});

export const updateEmployeeSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  username: z.string().trim().min(4).max(30).regex(/^[a-zA-Z0-9._-]+$/).transform((value) => value.toLowerCase()).optional(),
  email: optionalEmail,
  phone: optionalPhone,
  role: adminRoleSchema.optional(),
  isActive: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Không có dữ liệu cần cập nhật' });

export const resetEmployeePasswordSchema = z.object({
  newPassword: z.string().min(8).max(72),
});

export const disableEmployeeSchema = z.object({
  reassignToAdminId: z.string().uuid().nullable().optional(),
});
