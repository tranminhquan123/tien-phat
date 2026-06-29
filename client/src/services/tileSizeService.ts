import { adminUpdateConfig, getSiteConfig } from './configService';
import {
  DEFAULT_TILE_SIZES,
  TILE_SIZE_CONFIG_KEY,
  parseTileSizes,
  type TileSizeOption,
} from '@/constants/tileSizes';

export async function getTileSizes(): Promise<TileSizeOption[]> {
  try {
    const response = await getSiteConfig();
    return parseTileSizes(response.data?.[TILE_SIZE_CONFIG_KEY]);
  } catch {
    return DEFAULT_TILE_SIZES;
  }
}

export async function saveTileSizes(sizes: TileSizeOption[]) {
  await adminUpdateConfig({
    [TILE_SIZE_CONFIG_KEY]: JSON.stringify(sizes),
  });
  return sizes;
}
