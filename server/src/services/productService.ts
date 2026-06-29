// src/services/productService.ts
import { prisma } from '@/lib/prisma';

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ── PUBLIC ──────────────────────────────────────────────────────────────────

export async function getPublicProducts(params: {
  categorySlug?: string;
  size?: string;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}) {
  const { categorySlug, size, search, featured, page = 1, limit = 12 } = params;
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(featured && { isFeatured: true }),
    ...(categorySlug && { category: { slug: categorySlug } }),
    ...(size && { size }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { brand: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getPublicProductBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: 'asc' } },
    },
  });

  if (!product) return null;

  const related = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isActive: true,
      id: { not: product.id },
      ...(product.size && { size: product.size }),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: {
        orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
        take: 1,
      },
    },
    take: 4,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });

  return { product, related };
}

// ── ADMIN ────────────────────────────────────────────────────────────────────

export async function getAdminProducts(params: {
  search?: string;
  categoryId?: string;
  size?: string;
  page?: number;
  limit?: number;
}) {
  const { search, categoryId, size, page = 1, limit = 20 } = params;
  const skip = (page - 1) * limit;

  const where = {
    ...(categoryId && { categoryId }),
    ...(size && { size }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { brand: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1 },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function createProduct(data: {
  name: string;
  description?: string;
  price?: number;
  unit?: string;
  brand?: string;
  origin?: string;
  size?: string;
  color?: string;
  productType?: string;
  surface?: string;
  glaze?: string;
  application?: string;
  pattern?: string;
  spaces?: string;
  collection?: string;
  faceCount?: number;
  piecesPerBox?: number;
  areaPerBox?: number;
  categoryId: string;
  isActive?: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  images?: Array<{ url: string; altText?: string; isPrimary?: boolean; sortOrder?: number }>;
}) {
  const { images, ...productData } = data;
  const slug = toSlug(data.name);

  return prisma.product.create({
    data: {
      ...productData,
      slug,
      images: images ? { create: images } : undefined,
    },
    include: { category: true, images: true },
  });
}

export async function updateProduct(
  id: string,
  data: Partial<{
    name: string;
    description: string | null;
    price: number | null;
    unit: string | null;
    brand: string | null;
    origin: string | null;
    size: string | null;
    color: string | null;
    productType: string | null;
    surface: string | null;
    glaze: string | null;
    application: string | null;
    pattern: string | null;
    spaces: string | null;
    collection: string | null;
    faceCount: number | null;
    piecesPerBox: number | null;
    areaPerBox: number | null;
    categoryId: string;
    isActive: boolean;
    isFeatured: boolean;
    sortOrder: number;
  }>
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.name) {
    updateData.slug = toSlug(data.name);
  }

  return prisma.product.update({
    where: { id },
    data: updateData,
    include: { category: true, images: true },
  });
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
}

export async function addProductImage(
  productId: string,
  imageData: { url: string; altText?: string; isPrimary?: boolean; sortOrder?: number }
) {
  if (imageData.isPrimary) {
    await prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
  }
  return prisma.productImage.create({ data: { ...imageData, productId } });
}

export async function deleteProductImage(imageId: string) {
  await prisma.productImage.delete({ where: { id: imageId } });
}
