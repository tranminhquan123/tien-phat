import { normalizeVietnamese } from '@/utils/advisoryParser';

export type ContactChannel = 'ZALO' | 'PHONE' | 'EMAIL' | 'UNKNOWN';
export type LeadLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ExtractedRequirements = {
  size: string | null;
  intent: string | null;
  application: string | null;
  space: string | null;
  brand: string | null;
  color: string | null;
  areaM2: number | null;
  budget: string | null;
  location: string | null;
  purchaseTimeline: string | null;
  contactChannel: ContactChannel;
  wantsQuote: boolean;
  notes: string[];
};

export type ConversationLine = {
  sender: string;
  content: string;
};

export type RequirementHints = {
  size?: string | null;
  intent?: string | null;
  space?: string | null;
  brand?: string | null;
  color?: string | null;
};

export type DraftProduct = {
  name: string;
  size?: string | null;
  brand?: string | null;
};

const INTENT_LABELS: Record<string, string> = {
  LAT_NEN: 'lát nền',
  OP_TUONG: 'ốp tường',
  LAT_NGOAI_TROI: 'lát sân hoặc khu vực ngoài trời',
  THIET_BI_VE_SINH: 'thiết bị vệ sinh',
  SON_NUOC: 'sơn nước',
  CHONG_THAM: 'chống thấm',
  NOI_THAT_GO: 'nội thất gỗ',
  XI_MANG_VUA: 'xi măng hoặc vữa',
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
  'cong-trinh-cong-cong': 'công trình công cộng',
};

function customerText(messages: ConversationLine[]) {
  return messages
    .filter((message) => message.sender === 'CUSTOMER')
    .map((message) => message.content.trim())
    .filter(Boolean)
    .join('\n');
}

function normalizeDecimal(value: string) {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function detectArea(text: string) {
  const matches = [...text.matchAll(/(\d{1,5}(?:[.,]\d{1,2})?)\s*(?:m2|m²|mét\s*vuông|met\s*vuong)\b/giu)];
  if (!matches.length) return null;
  return normalizeDecimal(matches[matches.length - 1]?.[1] || '');
}

function detectBudget(text: string) {
  const matches = [...text.matchAll(/(\d+(?:[.,]\d+)?)\s*(triệu|trieu|tr|tỷ|ty|nghìn|nghin|k)\b/giu)];
  const match = matches[matches.length - 1];
  return match?.[0]?.trim() || null;
}

function cleanLocation(value: string) {
  return value
    .split(/[,.;\n]|\b(?:diện tích|dien tich|khoảng|khoang|muốn|muon|cần|can|và|va|ngân sách|ngan sach)\b/iu)[0]
    ?.trim()
    .replace(/\s+/g, ' ')
    .slice(0, 80) || null;
}

function detectLocation(text: string) {
  const patterns = [
    /(?:công trình|cong trinh)\s+(?:tại|tai|ở|o)\s+([^\n]{2,100})/giu,
    /(?:giao|thi công|thi cong)\s+(?:tại|tai|ở|o|đến|den)\s+([^\n]{2,100})/giu,
    /\b(?:tại|tai|ở|o)\s+([^\n]{2,100})/giu,
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    const value = matches[matches.length - 1]?.[1];
    const cleaned = value ? cleanLocation(value) : null;
    if (cleaned && cleaned.length >= 2) return cleaned;
  }

  return null;
}

function detectTimeline(normalized: string) {
  const patterns: Array<[string, string]> = [
    ['ngay hom nay', 'Hôm nay'],
    ['hom nay', 'Hôm nay'],
    ['ngay mai', 'Ngày mai'],
    ['tuan nay', 'Tuần này'],
    ['tuan sau', 'Tuần sau'],
    ['thang nay', 'Tháng này'],
    ['thang sau', 'Tháng sau'],
    ['cang som cang tot', 'Càng sớm càng tốt'],
    ['can gap', 'Cần gấp'],
    ['gap', 'Cần gấp'],
  ];

  const direct = patterns.find(([keyword]) => normalized.includes(keyword));
  if (direct) return direct[1];

  const days = normalized.match(/trong\s+(\d{1,3})\s+ngay/);
  if (days?.[1]) return `Trong ${days[1]} ngày`;

  return null;
}

function detectChannel(normalized: string): ContactChannel {
  if (normalized.includes('zalo')) return 'ZALO';
  if (normalized.includes('email') || normalized.includes('mail')) return 'EMAIL';
  if (normalized.includes('goi dien') || normalized.includes('dien thoai') || normalized.includes('goi lai')) return 'PHONE';
  return 'UNKNOWN';
}

function detectCompactSize(normalized: string) {
  const explicit = normalized.match(/\b(\d{2,3})\s*x\s*(\d{2,3})\b/);
  if (explicit?.[1] && explicit[2]) return `${Number(explicit[1])}x${Number(explicit[2])}`;

  const compactTokens = normalized.match(/\b\d{4,6}\b/g) || [];
  for (const token of compactTokens) {
    if (token.length === 4) return `${Number(token.slice(0, 2))}x${Number(token.slice(2))}`;
    if (token.length === 6) return `${Number(token.slice(0, 3))}x${Number(token.slice(3))}`;
  }

  return null;
}

function detectIntent(normalized: string) {
  if (normalized.includes('lat san') || normalized.includes('ngoai troi') || normalized.includes('ban cong') || normalized.includes('san thuong')) return 'LAT_NGOAI_TROI';
  if (normalized.includes('op tuong') || normalized.includes('gach tuong') || normalized.includes('op bep')) return 'OP_TUONG';
  if (normalized.includes('lat nen') || normalized.includes('san nha') || normalized.includes('gach lat')) return 'LAT_NEN';
  if (normalized.includes('thiet bi ve sinh') || normalized.includes('bon cau') || normalized.includes('lavabo') || normalized.includes('voi sen')) return 'THIET_BI_VE_SINH';
  if (normalized.includes('chong tham')) return 'CHONG_THAM';
  if (normalized.includes('son nuoc') || normalized.includes('son tuong')) return 'SON_NUOC';
  if (normalized.includes('noi that go') || normalized.includes('san go')) return 'NOI_THAT_GO';
  if (normalized.includes('xi mang') || normalized.includes('vua tron')) return 'XI_MANG_VUA';
  return null;
}

function detectSpace(normalized: string) {
  const entries: Array<[string, string[]]> = [
    ['phong-khach', ['phong khach']],
    ['phong-ngu', ['phong ngu']],
    ['phong-bep', ['phong bep', 'nha bep', 'khu bep']],
    ['nha-tam', ['nha tam', 'phong tam', 'toilet', 'wc', 'nha ve sinh']],
    ['ban-cong', ['ban cong']],
    ['san-thuong', ['san thuong']],
    ['san-vuon', ['san vuon', 'san truoc', 'san sau']],
    ['mat-tien', ['mat tien']],
    ['quan-ca-phe', ['quan cafe', 'quan ca phe']],
  ];
  return entries.find(([, terms]) => terms.some((term) => normalized.includes(term)))?.[0] || null;
}

function detectColor(normalized: string) {
  const colors = ['trang', 'kem', 'xam', 'den', 'nau', 'be', 'vang', 'xanh', 'hong', 'do'];
  const tokens = new Set(normalized.split(' '));
  return colors.find((color) => normalized.includes(`mau ${color}`) || tokens.has(color)) || null;
}

export function extractRequirementsByRules(
  messages: ConversationLine[],
  hints: RequirementHints = {}
): ExtractedRequirements {
  const text = customerText(messages);
  const normalized = normalizeVietnamese(text);
  const intent = hints.intent || detectIntent(normalized);
  const wantsQuote = [
    'bao gia', 'xin gia', 'gui gia', 'don gia', 'gia bao nhieu', 'can gia',
  ].some((keyword) => normalized.includes(keyword));
  const contactChannel = detectChannel(normalized);
  const purchaseTimeline = detectTimeline(normalized);
  const budget = detectBudget(text);
  const areaM2 = detectArea(text);
  const location = detectLocation(text);
  const notes: string[] = [];

  if (wantsQuote) notes.push('Khách muốn nhận báo giá');
  if (contactChannel !== 'UNKNOWN') notes.push(`Kênh liên hệ mong muốn: ${contactChannel}`);
  if (purchaseTimeline) notes.push(`Thời gian dự kiến: ${purchaseTimeline}`);

  return {
    size: hints.size || detectCompactSize(normalized),
    intent,
    application: intent ? INTENT_LABELS[intent] || intent : null,
    space: hints.space || detectSpace(normalized),
    brand: hints.brand || null,
    color: hints.color || detectColor(normalized),
    areaM2,
    budget,
    location,
    purchaseTimeline,
    contactChannel,
    wantsQuote,
    notes,
  };
}

export function mergeExtractedRequirements(
  ruleBased: ExtractedRequirements,
  aiExtracted?: Partial<ExtractedRequirements> | null
): ExtractedRequirements {
  if (!aiExtracted) return ruleBased;

  return {
    size: aiExtracted.size || ruleBased.size,
    intent: aiExtracted.intent || ruleBased.intent,
    application: aiExtracted.application || ruleBased.application,
    space: aiExtracted.space || ruleBased.space,
    brand: aiExtracted.brand || ruleBased.brand,
    color: aiExtracted.color || ruleBased.color,
    areaM2: aiExtracted.areaM2 ?? ruleBased.areaM2,
    budget: aiExtracted.budget || ruleBased.budget,
    location: aiExtracted.location || ruleBased.location,
    purchaseTimeline: aiExtracted.purchaseTimeline || ruleBased.purchaseTimeline,
    contactChannel: aiExtracted.contactChannel && aiExtracted.contactChannel !== 'UNKNOWN'
      ? aiExtracted.contactChannel
      : ruleBased.contactChannel,
    wantsQuote: Boolean(aiExtracted.wantsQuote || ruleBased.wantsQuote),
    notes: [...new Set([...(ruleBased.notes || []), ...(aiExtracted.notes || [])])].slice(0, 8),
  };
}

export function calculateLeadScore(
  requirements: ExtractedRequirements,
  contact: { phone?: string | null; email?: string | null }
) {
  let score = 0;

  if (contact.phone) score += 20;
  if (contact.email) score += 5;
  if (requirements.size) score += 10;
  if (requirements.intent || requirements.application) score += 10;
  if (requirements.space) score += 8;
  if (requirements.areaM2) score += 15;
  if (requirements.brand) score += 5;
  if (requirements.color) score += 4;
  if (requirements.location) score += 8;
  if (requirements.budget) score += 7;
  if (requirements.purchaseTimeline) score += 5;
  if (requirements.wantsQuote) score += 8;
  if (requirements.contactChannel !== 'UNKNOWN') score += 5;

  return Math.min(100, score);
}

export function getLeadLevel(score: number): LeadLevel {
  if (score >= 70) return 'HIGH';
  if (score >= 40) return 'MEDIUM';
  return 'LOW';
}

function humanSize(size: string | null) {
  return size ? size.replace('x', ' x ') : null;
}

function humanSpace(space: string | null) {
  if (!space) return null;
  return SPACE_LABELS[space] || space.replace(/-/g, ' ');
}

export function buildRuleBasedSummary(
  requirements: ExtractedRequirements,
  customerName?: string | null
) {
  const need = [
    requirements.size ? `kích thước ${humanSize(requirements.size)}` : null,
    requirements.application,
    requirements.space ? `cho ${humanSpace(requirements.space)}` : null,
  ].filter(Boolean).join(', ');
  const details = [
    requirements.brand ? `thương hiệu ${requirements.brand}` : null,
    requirements.color ? `màu ${requirements.color}` : null,
    requirements.areaM2 ? `diện tích khoảng ${requirements.areaM2} m²` : null,
    requirements.location ? `công trình tại ${requirements.location}` : null,
    requirements.budget ? `ngân sách ${requirements.budget}` : null,
    requirements.purchaseTimeline ? `dự kiến ${requirements.purchaseTimeline.toLowerCase()}` : null,
  ].filter(Boolean);
  const channel = requirements.contactChannel !== 'UNKNOWN'
    ? ` Khách muốn trao đổi qua ${requirements.contactChannel === 'PHONE' ? 'điện thoại' : requirements.contactChannel}.`
    : '';
  const quote = requirements.wantsQuote ? ' Khách đang quan tâm báo giá.' : '';
  const subject = customerName ? `Khách ${customerName}` : 'Khách hàng';

  if (!need && details.length === 0) {
    return `${subject} chưa cung cấp đủ nhu cầu cụ thể. Cần hỏi thêm loại sản phẩm, khu vực sử dụng, kích thước và số lượng dự kiến.`;
  }

  return `${subject} cần ${need || 'được tư vấn sản phẩm'}.${details.length ? ` Thông tin thêm: ${details.join(', ')}.` : ''}${quote}${channel}`.replace(/\s+/g, ' ').trim();
}

export function buildRecommendationQuery(requirements: ExtractedRequirements) {
  return [
    requirements.size,
    requirements.application,
    humanSpace(requirements.space),
    requirements.brand,
    requirements.color ? `màu ${requirements.color}` : null,
  ].filter(Boolean).join(' ');
}

export function buildRuleBasedDraft(params: {
  customerName?: string | null;
  summary: string;
  requirements: ExtractedRequirements;
  products?: DraftProduct[];
}) {
  const { customerName, requirements, products = [] } = params;
  const greeting = customerName
    ? `Chào anh/chị ${customerName},`
    : 'Chào anh/chị,';
  const need = [
    requirements.size ? `gạch ${humanSize(requirements.size)}` : null,
    requirements.application,
    requirements.space ? `cho ${humanSpace(requirements.space)}` : null,
  ].filter(Boolean).join(' ');
  const productSentence = products[0]
    ? ` Bên em đang có mẫu ${products[0].name}${products[0].brand ? ` của ${products[0].brand}` : ''} phù hợp để anh/chị tham khảo.`
    : '';
  const nextQuestion = !requirements.areaM2
    ? ' Anh/chị cho em xin diện tích dự kiến để em tính số lượng và tư vấn chính xác hơn nhé.'
    : requirements.wantsQuote
      ? ` Em sẽ kiểm tra giá và số lượng phù hợp cho khoảng ${requirements.areaM2} m² rồi phản hồi anh/chị.`
      : ` Với diện tích khoảng ${requirements.areaM2} m², em sẽ hỗ trợ tính số lượng phù hợp cho anh/chị.`;
  const channel = requirements.contactChannel === 'ZALO'
    ? ' Em sẽ ưu tiên gửi thông tin qua Zalo theo yêu cầu của anh/chị.'
    : requirements.contactChannel === 'EMAIL'
      ? ' Em sẽ ưu tiên gửi thông tin qua email theo yêu cầu của anh/chị.'
      : '';

  return `${greeting} Tiến Phát đã xem nhu cầu${need ? ` ${need}` : ''}.${productSentence}${nextQuestion}${channel}`
    .replace(/\s+/g, ' ')
    .trim();
}
