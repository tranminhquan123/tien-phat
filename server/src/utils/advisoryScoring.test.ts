import assert from 'node:assert/strict';
import test from 'node:test';
import { rankProducts } from './advisoryScoring';
import type { AdvisoryAnalysis } from './advisoryParser';

const analysis: AdvisoryAnalysis = {
  normalizedText: 'gach 3060 lat san phong khach dong tam mau kem',
  size: '30x60',
  intent: 'LAT_NEN',
  intentLabel: 'lát nền',
  categorySlug: 'gach-op-lat',
  space: 'phong-khach',
  spaceLabel: 'phòng khách',
  brand: 'Đồng Tâm',
  color: 'kem',
};

const products = [
  {
    id: 'perfect',
    name: 'Gạch Đồng Tâm 3060 màu kem',
    description: 'Gạch lát nền phòng khách',
    brand: 'Đồng Tâm',
    size: '30x60',
    color: 'Kem',
    application: 'Lát nền',
    spaces: 'Phòng khách',
    isFeatured: true,
    category: { slug: 'gach-op-lat', name: 'Gạch Ốp Lát' },
  },
  {
    id: 'wrong-size',
    name: 'Gạch Đồng Tâm 6060 màu kem',
    description: 'Gạch lát nền phòng khách',
    brand: 'Đồng Tâm',
    size: '60x60',
    color: 'Kem',
    application: 'Lát nền',
    spaces: 'Phòng khách',
    category: { slug: 'gach-op-lat', name: 'Gạch Ốp Lát' },
  },
  {
    id: 'unrelated',
    name: 'Sơn ngoại thất',
    size: null,
    category: { slug: 'son-nuoc', name: 'Sơn Nước' },
  },
];

test('rankProducts puts exact, semantically matching product first', () => {
  const ranked = rankProducts(products, analysis, 6);
  assert.equal(ranked[0]?.product.id, 'perfect');
  assert.equal(ranked[0]?.exactSize, true);
  assert.ok((ranked[0]?.score ?? 0) > (ranked[1]?.score ?? 0));
});

test('rankProducts removes unrelated zero-score products', () => {
  const ranked = rankProducts(products, analysis, 6);
  assert.equal(ranked.some((item) => item.product.id === 'unrelated'), false);
});
