import { z } from 'zod';
import type { AdvisoryIntent } from '@/utils/advisoryParser';
import { prisma } from '@/lib/prisma';
import {
  isOpenAIConfigured,
  requestStructuredJson,
} from '@/services/openAiService';
import {
  recommendProducts,
  type ProductRecommendation,
} from '@/services/recommendationService';
import {
  buildRecommendationQuery,
  buildRuleBasedDraft,
  buildRuleBasedSummary,
  calculateLeadScore,
  extractRequirementsByRules,
  getLeadLevel,
  mergeExtractedRequirements,
  type ConversationLine,
  type ExtractedRequirements,
} from '@/utils/adminAiRules';

export class AdminAiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AdminAiError';
    this.statusCode = statusCode;
  }
}

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
  notes: z.array(z.string()).max(8),
});

const aiAnalysisSchema = z.object({
  summary: z.string().min(20).max(1200),
  requirements: requirementsSchema,
});

const aiDraftSchema = z.object({
  draft: z.string().min(10).max(2000),
});

const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['summary', 'requirements'],
  properties: {
    summary: { type: 'string' },
    requirements: {
      type: 'object',
      additionalProperties: false,
      required: [
        'size', 'intent', 'application', 'space', 'brand', 'color',
        'areaM2', 'budget', 'location', 'purchaseTimeline',
        'contactChannel', 'wantsQuote', 'notes',
      ],
      properties: {
        size: { type: ['string', 'null'] },
        intent: { type: ['string', 'null'] },
        application: { type: ['string', 'null'] },
        space: { type: ['string', 'null'] },
        brand: { type: ['string', 'null'] },
        color: { type: ['string', 'null'] },
        areaM2: { type: ['number', 'null'] },
        budget: { type: ['string', 'null'] },
        location: { type: ['string', 'null'] },
        purchaseTimeline: { type: ['string', 'null'] },
        contactChannel: {
          type: 'string',
          enum: ['ZALO', 'PHONE', 'EMAIL', 'UNKNOWN'],
        },
        wantsQuote: { type: 'boolean' },
        notes: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  },
} as const;

const DRAFT_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['draft'],
  properties: {
    draft: { type: 'string' },
  },
} as const;

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

function compactTranscript(messages: ConversationLine[], maximumCharacters = 24_000) {
  const labels: Record<string, string> = {
    CUSTOMER: 'Khách hàng',
    ASSISTANT: 'Trợ lý tự động',
    ADMIN: 'Nhân viên',
    SYSTEM: 'Hệ thống',
  };
  const lines = messages
    .slice(-80)
    .map((message) => `${labels[message.sender] || message.sender}: ${message.content.slice(0, 2000)}`);

  while (lines.join('\n').length > maximumCharacters && lines.length > 6) {
    lines.shift();
  }

  return lines.join('\n');
}

function parseStoredRequirements(value: unknown) {
  const parsed = requirementsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

async function loadAiContext(sessionId: string) {
  const session = await prisma.chatSession.findUnique({
    where: { id: sessionId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 160,
        select: { sender: true, content: true, createdAt: true },
      },
    },
  });

  if (!session) throw new AdminAiError('Không tìm thấy cuộc trò chuyện', 404);

  return session;
}

async function buildProductSuggestions(requirements: ExtractedRequirements) {
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

function publicAnalysis(params: {
  summary: string;
  requirements: ExtractedRequirements;
  leadScore: number;
  suggestions: ProductRecommendation[];
  provider: 'openai' | 'rules';
  model: string | null;
  analyzedAt: Date;
  cached: boolean;
  warning?: string;
}) {
  return {
    summary: params.summary,
    requirements: params.requirements,
    leadScore: params.leadScore,
    leadLevel: getLeadLevel(params.leadScore),
    suggestedProducts: params.suggestions,
    provider: params.provider,
    model: params.model,
    analyzedAt: params.analyzedAt,
    cached: params.cached,
    aiConfigured: isOpenAIConfigured(),
    warning: params.warning,
  };
}

export async function analyzeAdminChatSession(
  sessionId: string,
  options: { force?: boolean } = {}
) {
  const session = await loadAiContext(sessionId);
  const storedRequirements = parseStoredRequirements(session.extractedRequirements);
  const cacheIsFresh = Boolean(
    !options.force
    && session.aiSummary
    && storedRequirements
    && session.leadScore !== null
    && session.lastAnalyzedAt
    && session.lastAnalyzedAt >= session.lastMessageAt
  );

  if (cacheIsFresh && storedRequirements && session.aiSummary && session.lastAnalyzedAt) {
    const suggestions = await buildProductSuggestions(storedRequirements);
    return publicAnalysis({
      summary: session.aiSummary,
      requirements: storedRequirements,
      leadScore: session.leadScore || 0,
      suggestions,
      provider: session.aiProvider === 'openai' ? 'openai' : 'rules',
      model: session.aiModel,
      analyzedAt: session.lastAnalyzedAt,
      cached: true,
    });
  }

  const messages = session.messages.map((message) => ({
    sender: message.sender,
    content: message.content,
  }));
  const ruleRequirements = extractRequirementsByRules(messages, {
    size: session.detectedSize,
    intent: session.detectedIntent,
    space: session.detectedSpace,
    brand: session.detectedBrand,
    color: session.detectedColor,
  });
  let requirements = ruleRequirements;
  let summary = buildRuleBasedSummary(ruleRequirements, session.customerName);
  let provider: 'openai' | 'rules' = 'rules';
  let model: string | null = null;
  let warning: string | undefined;

  if (isOpenAIConfigured()) {
    try {
      const response = await requestStructuredJson<unknown>({
        schemaName: 'tien_phat_customer_analysis',
        schema: ANALYSIS_JSON_SCHEMA,
        systemPrompt: [
          'Bạn là trợ lý phân tích nhu cầu khách hàng cho Công ty Tiến Phát, chuyên vật liệu xây dựng và nội thất.',
          'Hãy tóm tắt bằng tiếng Việt ngắn gọn, chính xác và trích xuất dữ liệu từ hội thoại.',
          'Không được suy đoán hoặc bịa thông tin. Trường nào khách chưa nói rõ phải trả về null hoặc UNKNOWN.',
          'Kích thước gạch chuẩn hóa dạng 30x60. intent ưu tiên mã: LAT_NEN, OP_TUONG, LAT_NGOAI_TROI, THIET_BI_VE_SINH, SON_NUOC, CHONG_THAM, NOI_THAT_GO, XI_MANG_VUA.',
          'space ưu tiên slug như phong-khach, phong-ngu, phong-bep, nha-tam, ban-cong, san-thuong, san-vuon, mat-tien.',
          'Chỉ ghi wantsQuote=true khi khách thực sự hỏi giá hoặc yêu cầu báo giá.',
        ].join('\n'),
        userPrompt: [
          `Tên khách: ${session.customerName || 'Chưa cung cấp'}`,
          `Điện thoại: ${session.phone || 'Chưa cung cấp'}`,
          `Email: ${session.email || 'Chưa cung cấp'}`,
          '',
          'Hội thoại:',
          compactTranscript(messages),
        ].join('\n'),
      });
      const parsed = aiAnalysisSchema.safeParse(response.data);
      if (!parsed.success) throw new Error('Dữ liệu AI không đúng cấu trúc');

      requirements = mergeExtractedRequirements(ruleRequirements, parsed.data.requirements);
      summary = parsed.data.summary.trim();
      provider = 'openai';
      model = response.model;
    } catch (error) {
      warning = `Không thể dùng OpenAI, đã chuyển sang phân tích dự phòng: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`;
      console.error('[Admin AI analysis]', error);
    }
  }

  const leadScore = calculateLeadScore(requirements, {
    phone: session.phone,
    email: session.email,
  });
  const suggestions = await buildProductSuggestions(requirements);
  const analyzedAt = new Date();

  await prisma.chatSession.update({
    where: { id: sessionId },
    data: {
      aiSummary: summary,
      leadScore,
      extractedRequirements: requirements,
      suggestedProductIds: suggestions.map((product) => product.id),
      aiProvider: provider,
      aiModel: model,
      lastAnalyzedAt: analyzedAt,
    },
  });

  return publicAnalysis({
    summary,
    requirements,
    leadScore,
    suggestions,
    provider,
    model,
    analyzedAt,
    cached: false,
    warning,
  });
}

async function selectedProducts(
  suggestions: ProductRecommendation[],
  selectedProductIds?: string[]
) {
  if (!selectedProductIds?.length) return suggestions.slice(0, 3);
  const selected = new Set(selectedProductIds.slice(0, 6));
  const fromSuggestions = suggestions.filter((product) => selected.has(product.id));
  if (fromSuggestions.length === selected.size) return fromSuggestions;

  const missingIds = [...selected].filter((id) => !fromSuggestions.some((product) => product.id === id));
  const rows = await prisma.product.findMany({
    where: { id: { in: missingIds }, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      unit: true,
      brand: true,
      size: true,
      category: { select: { name: true, slug: true } },
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        take: 1,
        select: { url: true },
      },
    },
  });

  return [
    ...fromSuggestions,
    ...rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      unit: row.unit,
      brand: row.brand,
      size: row.size,
      category: row.category,
      imageUrl: row.images[0]?.url,
      reasons: ['Sản phẩm được Admin chọn'],
      exactSize: false,
      score: 0,
    })),
  ].slice(0, 6);
}

export async function draftAdminReply(params: {
  sessionId: string;
  tone?: 'FRIENDLY' | 'CONCISE' | 'PROFESSIONAL';
  selectedProductIds?: string[];
}) {
  const session = await loadAiContext(params.sessionId);
  const analysis = await analyzeAdminChatSession(params.sessionId);
  const products = await selectedProducts(
    analysis.suggestedProducts,
    params.selectedProductIds
  );
  let draft = buildRuleBasedDraft({
    customerName: session.customerName,
    summary: analysis.summary,
    requirements: analysis.requirements,
    products,
  });
  let provider: 'openai' | 'rules' = 'rules';
  let model: string | null = null;
  let warning: string | undefined;

  if (isOpenAIConfigured()) {
    try {
      const toneLabel = params.tone === 'CONCISE'
        ? 'ngắn gọn'
        : params.tone === 'PROFESSIONAL'
          ? 'chuyên nghiệp'
          : 'thân thiện, lịch sự';
      const response = await requestStructuredJson<unknown>({
        schemaName: 'tien_phat_admin_reply',
        schema: DRAFT_JSON_SCHEMA,
        maxOutputTokens: 700,
        systemPrompt: [
          'Bạn soạn tin nhắn tư vấn cho nhân viên Công ty Tiến Phát.',
          `Giọng điệu: ${toneLabel}. Viết tiếng Việt tự nhiên, từ 2 đến 5 câu.`,
          'Không tự gửi tin nhắn. Không bịa giá, tồn kho, khuyến mãi hoặc cam kết thời gian giao hàng.',
          'Chỉ nhắc tên sản phẩm có trong danh sách được cung cấp.',
          'Nếu thiếu diện tích hoặc thông tin quan trọng, hãy hỏi đúng một câu rõ ràng.',
          'Không dùng markdown, tiêu đề hoặc dấu ngoặc kép quanh câu trả lời.',
        ].join('\n'),
        userPrompt: [
          `Khách hàng: ${session.customerName || 'Anh/chị'}`,
          `Tóm tắt: ${analysis.summary}`,
          `Dữ liệu trích xuất: ${JSON.stringify(analysis.requirements)}`,
          `Sản phẩm có thể tư vấn: ${products.map((product) => `${product.name} | ${product.size || ''} | ${product.brand || ''}`).join('\n') || 'Chưa có sản phẩm phù hợp'}`,
          '',
          'Các tin nhắn gần nhất:',
          compactTranscript(session.messages.slice(-14), 10_000),
        ].join('\n'),
      });
      const parsed = aiDraftSchema.safeParse(response.data);
      if (!parsed.success) throw new Error('Bản nháp AI không đúng cấu trúc');

      draft = parsed.data.draft.trim();
      provider = 'openai';
      model = response.model;
    } catch (error) {
      warning = `Không thể dùng OpenAI, đã tạo bản nháp dự phòng: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`;
      console.error('[Admin AI draft]', error);
    }
  }

  return {
    draft,
    provider,
    model,
    aiConfigured: isOpenAIConfigured(),
    selectedProducts: products,
    warning,
  };
}
