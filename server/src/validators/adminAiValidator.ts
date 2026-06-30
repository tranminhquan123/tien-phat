import { z } from 'zod';

export const adminAiAnalyzeSchema = z.object({
  force: z.boolean().optional().default(false),
});

export const adminAiDraftSchema = z.object({
  tone: z.enum(['FRIENDLY', 'CONCISE', 'PROFESSIONAL']).optional().default('FRIENDLY'),
  selectedProductIds: z.array(z.string().uuid()).max(6).optional().default([]),
});

export type AdminAiAnalyzeInput = z.infer<typeof adminAiAnalyzeSchema>;
export type AdminAiDraftInput = z.infer<typeof adminAiDraftSchema>;
