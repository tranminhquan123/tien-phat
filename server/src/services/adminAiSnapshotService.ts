import { z } from 'zod';
import type { AdvisoryIntent } from '@/utils/advisoryParser';
import { prisma } from '@/lib/prisma';
import { isOpenAIConfigured } from '@/services/openAiService';
import { recommendProducts } from '@/services/recommendationService';
import {
  buildRecommendationQuery,
  getLeadLevel,
  type ExtractedRequirements,
} from '@/utils/adminAiRules';
import { AdminAiError } from '@/services/adminAiService';

const requirementsSchema = z.object({
  size: z.string().nullable(),
  intent: z.string().nullable(),
  application: z.string().nullable(),
  space: z.string().nullable(),
  brand: z.string().nullable(),
  color: z.string().nullable(),
  areaM2: z.number().positive().nullable(),
  budget: z.string().nullable(),
  location: z.string().nullable(),
  purchaseTimeline: z.string().nullable(),
  contactChannel: z.enum(['ZALO', 'PHONE', 'EMAIL', 'UNKNOWN']),
  wantsQuote: z.boolean(),
  notes: z.array(z.string()),
});

const INTENT_CATEGORY: Record<string, string> = {
  LAT_NEN: 'gach-op-lat',
  OP_TUONG: 'gach-op-lat',
  LAT_NGOAI_TROI: 'gach-op-lat',
  THIET_BI_VE_SINH: 'thiet-bi-ve-sinh',
  SON_NUOC: 'son-nuoc',
  CHONG_THAM: 'vat-lieu-chong-tham',
  NOI_THAT_GO: 'noi-that-go',
  XI_MANG_VUA: 'xi-mang-vua-tron',
};

const SPACE_LABELS: Record<string, string> = {
  'phong-khach': 'phòng khách',
  'phong-ngu': 'phòng ngủ',
  'phong-bep': 'phòng bếp',
  'nha-tam': 'nhà tắm',
  'ban-cong': 'ban công',
  'san-thuong': 'sân thượng',
  'san-vuon': 'sân vườn',
  'mat-tien': 'mặt tiền',
  'quan-ca-phe': 'quán cà phê',
};

async function rebuildSuggestions(requirements: ExtractedRequirements) {
  const query = buildRecommendationQuery(requirements);
  if (!query) return [];

  const result = await recommendProducts(query, {
    size: requirements.size || undefined,
    intent: requirements.intent as AdvisoryIntent | undefined,
    intentLabel: requirements.application || undefined,
    categorySlug: requirements.intent ? INTENT_CATEGORY[requirements.intent] : undefined,
    space: requirements.space || undefined,
    spaceLabel: requirements.space ? SPACE_LABELS[requirements.space] : undefined,
    brand: requirements.brand || undefined,
    color: requirements.color || undefined,
  });

  return result.recommendations.slice(0, 5);
}

export async function getStoredAdminAiAnalysis(sessionId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      aiSummary: true,
      leadScore: true,
      extractedRequirements: true,
      aiProvider: true,
      aiModel: true,
      lastAnalyzedAt: true,
      lastMessageAt: true,
    },
  });

  if (!session) throw new AdminAiError('Không tìm thấy cuộc trò chuyện', 404);

  const parsed = requirementsSchema.safeParse(session.extractedRequirements);
  if (!session.aiSummary || !parsed.success || session.leadScore === null || !session.lastAnalyzedAt) {
    return {
      analysis: null,
      aiConfigured: isOpenAIConfigured(),
    };
  }

  const suggestedProducts = await rebuildSuggestions(parsed.data);
  return {
    analysis: {
      summary: session.aiSummary,
      requirements: parsed.data,
      leadScore: session.leadScore,
      leadLevel: getLeadLevel(session.leadScore),
      suggestedProducts,
      provider: session.aiProvider === 'openai' ? 'openai' : 'rules',
      model: session.aiModel,
      analyzedAt: session.lastAnalyzedAt,
      cached: true,
      stale: session.lastAnalyzedAt < session.lastMessageAt,
      aiConfigured: isOpenAIConfigured(),
    },
    aiConfigured: isOpenAIConfigured(),
  };
}
