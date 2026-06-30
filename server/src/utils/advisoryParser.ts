export type AdvisoryIntent =
  | 'LAT_NEN'
  | 'OP_TUONG'
  | 'LAT_NGOAI_TROI'
  | 'THIET_BI_VE_SINH'
  | 'SON_NUOC'
  | 'CHONG_THAM'
  | 'NOI_THAT_GO'
  | 'XI_MANG_VUA';

export type AdvisoryAnalysis = {
  normalizedText: string;
  size?: string;
  intent?: AdvisoryIntent;
  intentLabel?: string;
  categorySlug?: string;
  space?: string;
  spaceLabel?: string;
  brand?: string;
  color?: string;
};

type IntentDefinition = {
  value: AdvisoryIntent;
  label: string;
  categorySlug: string;
  keywords: string[];
};

type SpaceDefinition = {
  value: string;
  label: string;
  keywords: string[];
};

const INTENTS: IntentDefinition[] = [
  {
    value: 'LAT_NGOAI_TROI',
    label: 'lát sân hoặc khu vực ngoài trời',
    categorySlug: 'gach-op-lat',
    keywords: [
      'lat san', 'san truoc', 'san sau', 'san thuong', 'ban cong',
      'ngoai troi', 'loi di', 'chong tron', 'chong truot',
    ],
  },
  {
    value: 'OP_TUONG',
    label: 'ốp tường',
    categorySlug: 'gach-op-lat',
    keywords: [
      'op tuong', 'gach tuong', 'op bep', 'tuong bep', 'op nha tam',
      'op toilet', 'op wc', 'op mat tien',
    ],
  },
  {
    value: 'LAT_NEN',
    label: 'lát nền',
    categorySlug: 'gach-op-lat',
    keywords: [
      'lat nen', 'lat san', 'san nha', 'nen nha', 'nen phong',
      'gach nen', 'gach lat', 'lat phong',
    ],
  },
  {
    value: 'THIET_BI_VE_SINH',
    label: 'thiết bị vệ sinh',
    categorySlug: 'thiet-bi-ve-sinh',
    keywords: [
      'thiet bi ve sinh', 'bon cau', 'lavabo', 'voi sen', 'voi rua',
      'chau rua', 'sen tam',
    ],
  },
  {
    value: 'CHONG_THAM',
    label: 'chống thấm',
    categorySlug: 'vat-lieu-chong-tham',
    keywords: ['chong tham', 'tham dot', 'tham nuoc', 'chong dot', 'xu ly tham'],
  },
  {
    value: 'SON_NUOC',
    label: 'sơn nước',
    categorySlug: 'son-nuoc',
    keywords: ['son nuoc', 'son nha', 'son tuong', 'son noi that', 'son ngoai that'],
  },
  {
    value: 'NOI_THAT_GO',
    label: 'nội thất gỗ',
    categorySlug: 'noi-that-go',
    keywords: ['noi that go', 'san go', 'cua go', 'go cong nghiep', 'go tu nhien'],
  },
  {
    value: 'XI_MANG_VUA',
    label: 'xi măng hoặc vữa',
    categorySlug: 'xi-mang-vua-tron',
    keywords: ['xi mang', 'vua tron', 'vua xay', 'vua lat', 'vua kho'],
  },
];

const SPACES: SpaceDefinition[] = [
  { value: 'phong-khach', label: 'phòng khách', keywords: ['phong khach'] },
  { value: 'phong-ngu', label: 'phòng ngủ', keywords: ['phong ngu'] },
  { value: 'phong-bep', label: 'phòng bếp', keywords: ['phong bep', 'nha bep', 'khu bep'] },
  { value: 'nha-tam', label: 'nhà tắm', keywords: ['nha tam', 'phong tam', 'toilet', 'wc', 'nha ve sinh'] },
  { value: 'ban-cong', label: 'ban công', keywords: ['ban cong'] },
  { value: 'san-thuong', label: 'sân thượng', keywords: ['san thuong'] },
  { value: 'san-vuon', label: 'sân vườn', keywords: ['san vuon', 'san truoc', 'san sau'] },
  { value: 'mat-tien', label: 'mặt tiền', keywords: ['mat tien'] },
  { value: 'quan-ca-phe', label: 'quán cà phê', keywords: ['quan cafe', 'quan ca phe'] },
  { value: 'cong-trinh-cong-cong', label: 'công trình công cộng', keywords: ['cong trinh cong cong', 'truong hoc', 'benh vien'] },
];

const COLORS = [
  'trang', 'kem', 'xam', 'den', 'nau', 'be', 'vang', 'xanh', 'hong', 'do',
];

export function normalizeVietnamese(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[×*]/g, 'x')
    .replace(/[^a-z0-9x]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeSizeValue(input: string) {
  const normalized = input
    .trim()
    .toLowerCase()
    .replace(/[×*]/g, 'x')
    .replace(/\s+/g, '');

  const match = normalized.match(/^(\d{2,3})x(\d{2,3})$/);
  if (!match) return null;

  return `${Number(match[1])}x${Number(match[2])}`;
}

export function buildSizeAliasMap(sizes: string[]) {
  const aliases = new Map<string, string>();

  for (const rawSize of sizes) {
    const size = normalizeSizeValue(rawSize);
    if (!size) continue;

    const [width, height] = size.split('x');
    if (!width || !height) continue;

    aliases.set(size, size);
    aliases.set(`${width}${height}`, size);
    aliases.set(`${width}-${height}`, size);

    if (width !== height) {
      aliases.set(`${height}x${width}`, size);
      aliases.set(`${height}${width}`, size);
      aliases.set(`${height}-${width}`, size);
    }
  }

  return aliases;
}

export function detectTileSize(message: string, availableSizes: string[]) {
  const aliases = buildSizeAliasMap(availableSizes);
  const normalized = normalizeVietnamese(message);

  const explicitMatches = normalized.matchAll(/\b(\d{2,3})\s*x\s*(\d{2,3})\b/g);
  for (const match of explicitMatches) {
    const candidate = `${Number(match[1])}x${Number(match[2])}`;
    return aliases.get(candidate) || normalizeSizeValue(candidate) || undefined;
  }

  const numericTokens = normalized.match(/\b\d{4,6}\b/g) ?? [];
  for (const token of numericTokens) {
    const matched = aliases.get(token);
    if (matched) return matched;
  }

  return undefined;
}

function findDefinition<T extends { keywords: string[] }>(normalizedText: string, definitions: T[]) {
  return definitions.find((definition) =>
    definition.keywords.some((keyword) => normalizedText.includes(keyword))
  );
}

export function detectIntent(message: string) {
  const normalized = normalizeVietnamese(message);
  return findDefinition(normalized, INTENTS);
}

export function detectSpace(message: string) {
  const normalized = normalizeVietnamese(message);
  return findDefinition(normalized, SPACES);
}

export function detectBrand(message: string, availableBrands: string[]) {
  const normalized = normalizeVietnamese(message);

  return availableBrands.find((brand) => {
    const normalizedBrand = normalizeVietnamese(brand);
    return normalizedBrand.length >= 2 && normalized.includes(normalizedBrand);
  });
}

export function detectColor(message: string) {
  const normalized = normalizeVietnamese(message);
  return COLORS.find((color) => normalized.includes(`mau ${color}`) || normalized.includes(` ${color} `));
}

export function analyzeAdvisoryMessage(
  message: string,
  availableSizes: string[],
  availableBrands: string[] = []
): AdvisoryAnalysis {
  const intent = detectIntent(message);
  const space = detectSpace(message);

  return {
    normalizedText: normalizeVietnamese(message),
    size: detectTileSize(message, availableSizes),
    intent: intent?.value,
    intentLabel: intent?.label,
    categorySlug: intent?.categorySlug,
    space: space?.value,
    spaceLabel: space?.label,
    brand: detectBrand(message, availableBrands),
    color: detectColor(message),
  };
}

export function mergeAdvisoryAnalysis(
  previous: Partial<AdvisoryAnalysis>,
  current: AdvisoryAnalysis
): AdvisoryAnalysis {
  return {
    normalizedText: current.normalizedText,
    size: current.size || previous.size,
    intent: current.intent || previous.intent,
    intentLabel: current.intentLabel || previous.intentLabel,
    categorySlug: current.categorySlug || previous.categorySlug,
    space: current.space || previous.space,
    spaceLabel: current.spaceLabel || previous.spaceLabel,
    brand: current.brand || previous.brand,
    color: current.color || previous.color,
  };
}
