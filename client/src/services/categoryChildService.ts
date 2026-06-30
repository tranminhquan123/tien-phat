import { adminUpdateConfig, getSiteConfig } from './configService';
import {
  DEFAULT_TILE_SIZES,
  TILE_SIZE_CONFIG_KEY,
  getTileSizeLabel,
  normalizeTileSize,
  parseTileSizes,
  type TileSizeOption,
} from '@/constants/tileSizes';
import type { SiteConfig } from '@/types';

export type CategoryChildOption = TileSizeOption;

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getCategoryChildConfigKey(categorySlug: string) {
  return categorySlug === 'gach-op-lat'
    ? TILE_SIZE_CONFIG_KEY
    : `category_children_${categorySlug}`;
}

export function normalizeCategoryChild(
  categorySlug: string,
  input: string
): CategoryChildOption | null {
  if (categorySlug === 'gach-op-lat') return normalizeTileSize(input);

  const label = input.trim().replace(/\s+/g, ' ');
  const value = toSlug(label);
  if (!label || !value) return null;

  return { value, label };
}

export function formatCategoryChildValue(categorySlug: string | undefined, value?: string | null) {
  if (!value) return '';
  if (categorySlug === 'gach-op-lat') return getTileSizeLabel(value);

  return value
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function parseGenericChildren(raw?: string | null): CategoryChildOption[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (typeof item === 'string') {
          const label = item.trim().replace(/\s+/g, ' ');
          const value = toSlug(label);
          return label && value ? { value, label } : null;
        }

        if (
          item &&
          typeof item === 'object' &&
          'value' in item &&
          'label' in item &&
          typeof item.value === 'string' &&
          typeof item.label === 'string'
        ) {
          const label = item.label.trim().replace(/\s+/g, ' ');
          const value = toSlug(item.value) || toSlug(label);
          return label && value ? { value, label } : null;
        }

        return null;
      })
      .filter((item): item is CategoryChildOption => Boolean(item));
  } catch {
    return [];
  }
}

export function buildCategoryChildrenMap(
  categorySlugs: string[],
  config: Partial<SiteConfig>
) {
  return categorySlugs.reduce<Record<string, CategoryChildOption[]>>((result, slug) => {
    const raw = config[getCategoryChildConfigKey(slug)];
    result[slug] = slug === 'gach-op-lat'
      ? parseTileSizes(raw)
      : parseGenericChildren(raw);
    return result;
  }, {});
}

export async function getCategoryChildrenMap(categorySlugs: string[]) {
  const response = await getSiteConfig();
  return buildCategoryChildrenMap(categorySlugs, response.data ?? {});
}

export async function getCategoryChildren(categorySlug: string) {
  try {
    const map = await getCategoryChildrenMap([categorySlug]);
    return map[categorySlug] ?? (categorySlug === 'gach-op-lat' ? DEFAULT_TILE_SIZES : []);
  } catch {
    return categorySlug === 'gach-op-lat' ? DEFAULT_TILE_SIZES : [];
  }
}

export async function saveCategoryChildren(
  categorySlug: string,
  children: CategoryChildOption[]
) {
  await adminUpdateConfig({
    [getCategoryChildConfigKey(categorySlug)]: JSON.stringify(children),
  });
  return children;
}
