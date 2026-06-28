// src/services/categoryService.ts
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

export async function getAllCategories(activeOnly = false) {
  return prisma.category.findMany({
    where: activeOnly ? { isActive: true } : {},
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
}

export async function createCategory(data: {
  name: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  const slug = toSlug(data.name);
  return prisma.category.create({ data: { ...data, slug } });
}

export async function updateCategory(
  id: string,
  data: Partial<{
    name: string;
    description: string;
    imageUrl: string;
    isActive: boolean;
    sortOrder: number;
  }>
) {
  const updateData: Record<string, unknown> = { ...data };
  if (data.name) updateData.slug = toSlug(data.name);
  return prisma.category.update({ where: { id }, data: updateData });
}

export async function deleteCategory(id: string) {
  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    throw new Error(`Không thể xóa danh mục đang có ${count} sản phẩm. Hãy chuyển sản phẩm sang danh mục khác trước.`);
  }
  await prisma.category.delete({ where: { id } });
}
