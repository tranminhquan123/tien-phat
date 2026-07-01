import { z } from 'zod';

export const crmStatusSchema = z.enum(['NEW', 'READING', 'RECEIVED', 'CONSULTING', 'WAITING_CUSTOMER', 'QUOTED', 'WON', 'LOST', 'REPLIED', 'CLOSED']);
export const crmPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const crmSourceSchema = z.enum(['CONTACT_FORM', 'CHATBOT', 'MANUAL', 'OTHER']);

export const contactListQuerySchema = z.object({
  status: crmStatusSchema.optional(),
  priority: crmPrioritySchema.optional(),
  source: crmSourceSchema.optional(),
  assignedAdminId: z.string().uuid().optional(),
  followUp: z.enum(['TODAY', 'OVERDUE', 'UPCOMING', 'NONE']).optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().positive().max(100000).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

const optionalNullableDate = z.union([
  z.string().datetime({ offset: true }).transform((value) => new Date(value)),
  z.null(),
]).optional();

export const contactUpdateSchema = z.object({
  status: crmStatusSchema.optional(),
  priority: crmPrioritySchema.optional(),
  source: crmSourceSchema.optional(),
  assignedAdminId: z.union([z.string().uuid(), z.null()]).optional(),
  followUpAt: optionalNullableDate,
  lastContactAt: optionalNullableDate,
  note: z.union([z.string().trim().max(5000), z.null()]).optional(),
  aiSummary: z.union([z.string().trim().max(5000), z.null()]).optional(),
  leadScore: z.union([z.number().int().min(0).max(100), z.null()]).optional(),
  extractedRequirements: z.union([z.record(z.unknown()), z.null()]).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: 'Không có dữ liệu cần cập nhật',
});

export const contactActivitySchema = z.object({
  type: z.enum(['CREATED', 'STATUS_CHANGED', 'NOTE_ADDED', 'FOLLOW_UP_SET', 'FOLLOW_UP_COMPLETED', 'CONTACTED', 'ASSIGNED', 'PRIORITY_CHANGED', 'SYSTEM']).default('NOTE_ADDED'),
  content: z.string().trim().min(1, 'Nội dung hoạt động không được để trống').max(2000),
});
