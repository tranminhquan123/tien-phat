import { z } from 'zod';

const optionalText = (maxLength: number) => z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  },
  z.string().max(maxLength).optional()
);

const optionalEmail = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  },
  z.string().email('Email không hợp lệ').max(160).optional()
);

export const createChatSessionSchema = z.object({
  sourcePage: optionalText(500),
});

export const sendChatMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Tin nhắn không được để trống')
    .max(1000, 'Tin nhắn tối đa 1000 ký tự'),
});

export const handoffChatSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100),
  phone: z
    .string()
    .trim()
    .min(8, 'Số điện thoại không hợp lệ')
    .max(20, 'Số điện thoại không hợp lệ')
    .regex(/^[0-9+().\s-]+$/, 'Số điện thoại không hợp lệ'),
  email: optionalEmail,
  note: optionalText(500),
});

export const adminChatReplySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Nội dung phản hồi không được để trống')
    .max(2000, 'Phản hồi tối đa 2000 ký tự'),
});

export const adminChatStatusSchema = z.object({
  status: z.enum(['AI_ACTIVE', 'WAITING_ADMIN', 'ADMIN_ACTIVE', 'CLOSED']),
});

export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type HandoffChatInput = z.infer<typeof handoffChatSchema>;
export type AdminChatReplyInput = z.infer<typeof adminChatReplySchema>;
export type AdminChatStatusInput = z.infer<typeof adminChatStatusSchema>;
