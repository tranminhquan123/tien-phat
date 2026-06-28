// src/services/configService.ts
import { prisma } from '@/lib/prisma';

export async function getAllConfigs(): Promise<Record<string, string>> {
  const configs = await prisma.siteConfig.findMany({ orderBy: { key: 'asc' } });
  const result: Record<string, string> = {};
  for (const c of configs) {
    result[c.key] = c.value;
  }
  return result;
}

export async function updateConfigs(data: Record<string, string>): Promise<Record<string, string>> {
  const updates = Object.entries(data).map(([key, value]) =>
    prisma.siteConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  );
  await Promise.all(updates);
  return getAllConfigs();
}

export async function getBanners(activeOnly = false) {
  return prisma.banner.findMany({
    where: activeOnly ? { isActive: true } : {},
    orderBy: { sortOrder: 'asc' },
  });
}

export async function upsertBanner(
  id: string | undefined,
  data: {
    title?: string;
    subtitle?: string;
    imageUrl: string;
    linkUrl?: string;
    isActive?: boolean;
    sortOrder?: number;
  }
) {
  if (id) {
    return prisma.banner.update({ where: { id }, data });
  }
  return prisma.banner.create({ data });
}

export async function deleteBanner(id: string) {
  await prisma.banner.delete({ where: { id } });
}
