import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeAdvisoryMessage,
  buildSizeAliasMap,
  detectTileSize,
  normalizeVietnamese,
} from './advisoryParser';

const SIZES = ['30x60', '30x30', '40x40', '40x80', '60x60', '80x80', '100x100'];

test('normalizeVietnamese removes accents and normalizes separators', () => {
  assert.equal(normalizeVietnamese('Gạch 30 × 60 lát sàn'), 'gach 30 x 60 lat san');
});

test('buildSizeAliasMap creates compact and reversed aliases', () => {
  const aliases = buildSizeAliasMap(['30x60']);
  assert.equal(aliases.get('3060'), '30x60');
  assert.equal(aliases.get('6030'), '30x60');
  assert.equal(aliases.get('60x30'), '30x60');
});

test('detectTileSize recognizes common customer formats', () => {
  assert.equal(detectTileSize('Tôi cần gạch 3060', SIZES), '30x60');
  assert.equal(detectTileSize('Gạch 6030 lát nền', SIZES), '30x60');
  assert.equal(detectTileSize('Mẫu 60 x 60', SIZES), '60x60');
  assert.equal(detectTileSize('Tìm loại 80×80', SIZES), '80x80');
  assert.equal(detectTileSize('Tôi cần 100100', SIZES), '100x100');
});

test('analyzeAdvisoryMessage extracts size, intent and space', () => {
  const result = analyzeAdvisoryMessage(
    'Tôi muốn tìm gạch 3060 lát sàn phòng khách Đồng Tâm màu kem',
    SIZES,
    ['Đồng Tâm', 'Prime']
  );

  assert.equal(result.size, '30x60');
  assert.equal(result.intent, 'LAT_NEN');
  assert.equal(result.categorySlug, 'gach-op-lat');
  assert.equal(result.space, 'phong-khach');
  assert.equal(result.brand, 'Đồng Tâm');
  assert.equal(result.color, 'kem');
});

test('outside-area wording takes priority over generic floor wording', () => {
  const result = analyzeAdvisoryMessage('Tôi cần gạch 8080 lát sân ban công chống trơn', SIZES);
  assert.equal(result.size, '80x80');
  assert.equal(result.intent, 'LAT_NGOAI_TROI');
  assert.equal(result.space, 'ban-cong');
});
