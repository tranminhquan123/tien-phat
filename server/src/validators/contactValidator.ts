import { z } from 'zod';

function optionalText(maxLength: number) {
  return z.preprocess(
    (value) => {
      if (typeof value !== 'string') return value;
      const trimmed = value.trim();
      return trimmed ? trimmed : undefined;
    },
    z.string().max(maxLength).optional()
  );
}

const optionalEmail = z.preprocess(
  (value) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  },
  z.string().email('Email không hợp lệ').max(160).optional()
);

const optionalPreferredContact = z.preprocess(
  (value) => value === '' ? undefined : value,
  z.enum(['PHONE', 'ZALO', 'EMAIL']).optional()
);

export const contactSubmissionSchema = z.object({
  name: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100),
  phone: z
    .string()
    .trim()
    .min(8, 'Số điện thoại không hợp lệ')
    .max(20, 'Số điện thoại không hợp lệ')
    .regex(/^[0-9+().\s-]+$/, 'Số điện thoại không hợp lệ'),
  email: optionalEmail,
  message: z.string().trim().min(5, 'Nội dung phải có ít nhất 5 ký tự').max(3000),
  inquiryType: optionalText(100),
  tileSize: optionalText(40),
  area: optionalText(60),
  location: optionalText(200),
  preferredContact: optionalPreferredContact,
  preferredTime: optionalText(120),
  sourcePage: optionalText(500),
  website: optionalText(200),
  startedAt: z.number().int().positive().optional(),
}).superRefine((data, context) => {
  if (data.preferredContact === 'EMAIL' && !data.email) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['email'],
      message: 'Vui lòng nhập email khi chọn hình thức liên hệ qua email',
    });
  }
});

export type ContactSubmissionInput = z.infer<typeof contactSubmissionSchema>;
