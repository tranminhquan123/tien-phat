import {
  normalizeSizeValue,
  normalizeVietnamese,
  type AdvisoryAnalysis,
} from './advisoryParser';

export type ScorableProduct = {
  id: string;
  name: string;
  description?: string | null;
  brand?: string | null;
  size?: string | null;
  color?: string | null;
  productType?: string | null;
  surface?: string | null;
  glaze?: string | null;
  application?: string | null;
  pattern?: string | null;
  spaces?: string | null;
  isFeatured?: boolean;
  category: {
    slug: string;
    name?: string;
  };
};

export type RankedProduct<T extends ScorableProduct> = {
  product: T;
  score: number;
  exactSize: boolean;
  reasons: string[];
};

const INTENT_TERMS: Record<NonNullable<AdvisoryAnalysis['intent']>, string[]> = {
  LAT_NEN: ['lat nen', 'lat san', 'san nha', 'nen nha', 'gach lat'],
  OP_TUONG: ['op tuong', 'gach tuong', 'op bep', 'op nha tam', 'op mat tien'],
  LAT_NGOAI_TROI: ['lat san', 'ngoai troi', 'ban cong', 'san thuong', 'chong tron', 'chong truot'],
  THIET_BI_VE_SINH: ['thiet bi ve sinh', 'bon cau', 'lavabo', 'voi sen', 'sen tam'],
  SON_NUOC: ['son nuoc', 'son tuong', 'son noi that', 'son ngoai that'],
  CHONG_THAM: ['chong tham', 'tham nuoc', 'xu ly tham'],
  NOI_THAT_GO: ['noi that go', 'san go', 'cua go'],
  XI_MANG_VUA: ['xi mang', 'vua tron', 'vua xay', 'vua lat'],
};

const SPACE_TERMS: Record<string, string[]> = {
  'phong-khach': ['phong khach'],
  'phong-ngu': ['phong ngu'],
  'phong-bep': ['phong bep', 'nha bep', 'khu bep'],
  'nha-tam': ['nha tam', 'phong tam', 'toilet', 'wc', 'nha ve sinh'],
  'ban-cong': ['ban cong'],
  'san-thuong': ['san thuong'],
  'san-vuon': ['san vuon', 'san truoc', 'san sau'],
  'mat-tien': ['mat tien'],
  'quan-ca-phe': ['quan cafe', 'quan ca phe'],
  'cong-trinh-cong-cong': ['cong trinh cong cong', 'truong hoc', 'benh vien'],
};

function containsAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function productSearchText(product: ScorableProduct) {
  return normalizeVietnamese([
    product.name,
    product.description,
    product.brand,
    product.color,
    product.productType,
    product.surface,
    product.glaze,
    product.application,
    product.pattern,
    product.spaces,
    product.category.name,
  ].filter(Boolean).join(' '));
}

export function scoreProduct<T extends ScorableProduct>(
  product: T,
  analysis: AdvisoryAnalysis
): RankedProduct<T> {
  const reasons: string[] = [];
  const text = productSearchText(product);
  let score = 0;
  let exactSize = false;

  if (analysis.size) {
    exactSize = normalizeSizeValue(product.size || '') === normalizeSizeValue(analysis.size);
    if (exactSize) {
      score += 50;
      reasons.push(`đúng kích thước ${analysis.size.replace('x', ' x ')}`);
    } else {
      score -= 12;
    }
  }

  if (analysis.categorySlug && product.category.slug === analysis.categorySlug) {
    score += 15;
    reasons.push('đúng nhóm sản phẩm');
  }

  if (analysis.intent) {
    const intentTerms = INTENT_TERMS[analysis.intent];
    if (containsAny(text, intentTerms)) {
      score += 30;
      reasons.push(analysis.intentLabel ? `phù hợp ${analysis.intentLabel}` : 'đúng công năng');
    } else if (analysis.categorySlug && product.category.slug === analysis.categorySlug) {
      score += 8;
    }
  }

  if (analysis.space) {
    const terms = SPACE_TERMS[analysis.space] || [normalizeVietnamese(analysis.spaceLabel || analysis.space)];
    if (containsAny(text, terms)) {
      score += 20;
      reasons.push(analysis.spaceLabel ? `phù hợp ${analysis.spaceLabel}` : 'đúng không gian');
    }
  }

  if (analysis.brand && product.brand) {
    if (normalizeVietnamese(product.brand) === normalizeVietnamese(analysis.brand)) {
      score += 12;
      reasons.push(`thương hiệu ${product.brand}`);
    }
  }

  if (analysis.color && product.color) {
    if (normalizeVietnamese(product.color).includes(normalizeVietnamese(analysis.color))) {
      score += 8;
      reasons.push(`màu ${product.color}`);
    }
  }

  const queryTokens = analysis.normalizedText
    .split(' ')
    .filter((token) => token.length >= 3 && !/^\d+$/.test(token));
  const matchedTokens = new Set(queryTokens.filter((token) => text.includes(token)));
  score += Math.min(matchedTokens.size * 2, 10);

  if (product.isFeatured) score += 3;

  return { product, score, exactSize, reasons };
}

export function rankProducts<T extends ScorableProduct>(
  products: T[],
  analysis: AdvisoryAnalysis,
  limit = 6
) {
  return products
    .map((product) => scoreProduct(product, analysis))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (left.exactSize !== right.exactSize) return left.exactSize ? -1 : 1;
      if (left.score !== right.score) return right.score - left.score;
      return left.product.name.localeCompare(right.product.name, 'vi');
    })
    .slice(0, limit);
}
