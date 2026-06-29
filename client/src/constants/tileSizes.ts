export type TileSizeOption = {
  value: string;
  label: string;
};

export const DEFAULT_TILE_SIZES: TileSizeOption[] = [
  { value: '30x60', label: '30 x 60' },
  { value: '30x30', label: '30 x 30' },
  { value: '40x40', label: '40 x 40' },
  { value: '40x80', label: '40 x 80' },
  { value: '60x60', label: '60 x 60' },
  { value: '80x80', label: '80 x 80' },
  { value: '100x100', label: '100 x 100' },
];

export const TILE_SIZE_CONFIG_KEY = 'product_tile_sizes';

export function normalizeTileSize(input: string): TileSizeOption | null {
  const value = input
    .trim()
    .toLowerCase()
    .replace(/×/g, 'x')
    .replace(/\s+/g, '');

  if (!/^\d+(?:\.\d+)?x\d+(?:\.\d+)?$/.test(value)) return null;

  const [width, height] = value.split('x');
  return {
    value,
    label: `${width} x ${height}`,
  };
}

export function parseTileSizes(raw?: string | null): TileSizeOption[] {
  if (!raw) return DEFAULT_TILE_SIZES;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_TILE_SIZES;

    const sizes = parsed
      .map((item) => {
        if (typeof item === 'string') return normalizeTileSize(item);
        if (
          item &&
          typeof item === 'object' &&
          'value' in item &&
          typeof item.value === 'string'
        ) {
          return normalizeTileSize(item.value);
        }
        return null;
      })
      .filter((item): item is TileSizeOption => Boolean(item));

    return sizes.length > 0 ? sizes : DEFAULT_TILE_SIZES;
  } catch {
    return DEFAULT_TILE_SIZES;
  }
}

export function getTileSizeLabel(value?: string | null) {
  if (!value) return '';
  return normalizeTileSize(value)?.label ?? value;
}
