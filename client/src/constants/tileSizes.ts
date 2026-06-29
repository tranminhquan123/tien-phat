export const TILE_SIZES = [
  { value: '30x60', label: '30 x 60' },
  { value: '30x30', label: '30 x 30' },
  { value: '40x40', label: '40 x 40' },
  { value: '40x80', label: '40 x 80' },
  { value: '60x60', label: '60 x 60' },
  { value: '80x80', label: '80 x 80' },
  { value: '100x100', label: '100 x 100' },
] as const;

export function getTileSizeLabel(value?: string | null) {
  return TILE_SIZES.find((size) => size.value === value)?.label ?? value ?? '';
}
