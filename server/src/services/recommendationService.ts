import { prisma } from '@/lib/prisma';
import { getAllConfigs } from '@/services/configService';
import {
  analyzeAdvisoryMessage,
  mergeAdvisoryAnalysis,
  normalizeSizeValue,
  type AdvisoryAnalysis,
} from '@/utils/advisoryParser';
import { rankProducts } from '@/utils/advisoryScoring';

const DEFAULT_SIZES = [
  '30x60', '30x30', '40x40', '40x80', '60x60', '80x80', '100x100',
];
const CATALOG_CACHE_MS = 60_000;

type CatalogProduct = Awaited<ReturnType<typeof loadCatalogFromDatabase>>['products'][number];

export type ProductRecommendation = {
  id: string;
  name: string;
  slug: string;
  price: number | null;
  unit: string | null;
  brand: string | null;
  size: string | null;
  category: {
    name: string;
    slug: string;
  };
  imageUrl?: string;
  reasons: string[];
  exactSize: boolean;
  score: number;
};

export type RecommendationResult = {
  analysis: AdvisoryAnalysis;
  reply: string;
  recommendations: ProductRecommendation[];
  quickReplies: string[];
};

let catalogCache: {
  expiresAt: number;
  products: CatalogProduct[];
  sizes: string[];
  brands: string[];
} | null = null;

function parseConfiguredSizes(raw?: string) {
  if (!raw) return [];

  try {
    const value = JSON.parse(raw) as unknown;
    if (!Array.isArray(value)) return [];

    return value
      .map((item) => {
        if (typeof item === 'string') return normalizeSizeValue(item);
        if (item && typeof item === 'object' && 'value' in item && typeof item.value === 'string') {
          return normalizeSizeValue(item.value);
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
  } catch {
    return [];
  }
}

async function loadCatalogFromDatabase() {
  const [products, config] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
          take: 1,
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 400,
    }),
    getAllConfigs(),
  ]);

  return { products, config };
}

async function getCatalog() {
  if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache;

  const { products, config } = await loadCatalogFromDatabase();
  const sizes = new Set<string>(DEFAULT_SIZES);
  const brands = new Set<string>();

  for (const size of parseConfiguredSizes(config['product_tile_sizes'])) sizes.add(size);

  for (const product of products) {
    const size = normalizeSizeValue(product.size || '');
    if (size) sizes.add(size);
    if (product.brand?.trim()) brands.add(product.brand.trim());
  }

  catalogCache = {
    expiresAt: Date.now() + CATALOG_CACHE_MS,
    products,
    sizes: [...sizes],
    brands: [...brands],
  };

  return catalogCache;
}

function formatSize(size?: string) {
  return size ? size.replace('x', ' x ') : '';
}

function buildQuickReplies(analysis: AdvisoryAnalysis, sizes: string[]) {
  if (!analysis.intent) {
    return ['Gạch lát nền', 'Gạch ốp tường', 'Gạch lát sân', 'Thiết bị vệ sinh'];
  }

  if (analysis.categorySlug === 'gach-op-lat' && !analysis.size) {
    return sizes
      .slice(0, 6)
      .map((size) => `Kích thước ${formatSize(size)}`);
  }

  if (!analysis.space && analysis.categorySlug === 'gach-op-lat') {
    return ['Phòng khách', 'Phòng ngủ', 'Nhà tắm', 'Ban công'];
  }

  return ['Xem thêm sản phẩm', 'Gặp nhân viên tư vấn'];
}

function buildReply(
  analysis: AdvisoryAnalysis,
  recommendations: ProductRecommendation[]
) {
  if (!analysis.intent && !analysis.size && !analysis.brand) {
    return 'Anh/chị đang cần sản phẩm cho khu vực nào? Có thể nhập nhu cầu như “gạch 3060 lát sàn phòng khách”.';
  }

  if (analysis.categorySlug === 'gach-op-lat' && !analysis.size) {
    const need = analysis.intentLabel ? ` cho nhu cầu ${analysis.intentLabel}` : '';
    return `Em đã nhận diện anh/chị đang tìm gạch${need}. Anh/chị muốn dùng kích thước bao nhiêu?`;
  }

  if (!analysis.intent && analysis.size) {
    return `Em đã nhận diện kích thước ${formatSize(analysis.size)}. Anh/chị dùng để lát nền, ốp tường hay lát khu vực ngoài trời?`;
  }

  if (recommendations.length === 0) {
    return 'Hiện website chưa có sản phẩm phù hợp với toàn bộ yêu cầu này. Anh/chị có thể chọn “Gặp nhân viên tư vấn” để Tiến Phát tìm mẫu gần nhất.';
  }

  const hasExactSize = !analysis.size || recommendations.some((item) => item.exactSize);
  const needParts = [
    analysis.size ? `kích thước ${formatSize(analysis.size)}` : '',
    analysis.intentLabel || '',
    analysis.spaceLabel ? `cho ${analysis.spaceLabel}` : '',
    analysis.brand ? `thương hiệu ${analysis.brand}` : '',
  ].filter(Boolean);

  if (!hasExactSize) {
    return `Em chưa tìm thấy mẫu đúng kích thước ${formatSize(analysis.size)}. Dưới đây là những sản phẩm gần với nhu cầu ${needParts.slice(1).join(', ')} để anh/chị tham khảo.`;
  }

  return `Em tìm thấy ${recommendations.length} sản phẩm phù hợp với ${needParts.join(', ')}. Các mẫu được sắp xếp theo mức độ phù hợp.`;
}

function toRecommendation(
  item: ReturnType<typeof rankProducts<CatalogProduct>>[number]
): ProductRecommendation {
  const image = item.product.images[0];

  return {
    id: item.product.id,
    name: item.product.name,
    slug: item.product.slug,
    price: item.product.price,
    unit: item.product.unit,
    brand: item.product.brand,
    size: item.product.size,
    category: {
      name: item.product.category.name,
      slug: item.product.category.slug,
    },
    imageUrl: image?.url,
    reasons: item.reasons.slice(0, 3),
    exactSize: item.exactSize,
    score: item.score,
  };
}

export async function recommendProducts(
  message: string,
  previousAnalysis: Partial<AdvisoryAnalysis> = {}
): Promise<RecommendationResult> {
  const catalog = await getCatalog();
  const current = analyzeAdvisoryMessage(message, catalog.sizes, catalog.brands);
  const analysis = mergeAdvisoryAnalysis(previousAnalysis, current);

  const hasEnoughInformation = Boolean(
    analysis.intent || analysis.size || analysis.brand || analysis.color || analysis.space
  );

  const recommendations = hasEnoughInformation
    ? rankProducts(catalog.products, analysis, 6).map(toRecommendation)
    : [];

  return {
    analysis,
    recommendations,
    reply: buildReply(analysis, recommendations),
    quickReplies: buildQuickReplies(analysis, catalog.sizes),
  };
}

export function clearRecommendationCatalogCache() {
  catalogCache = null;
}
