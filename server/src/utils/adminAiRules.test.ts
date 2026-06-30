import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateLeadScore,
  extractRequirementsByRules,
  getLeadLevel,
} from './adminAiRules';

test('extracts area and preferred channel', () => {
  const result = extractRequirementsByRules([
    { sender: 'CUSTOMER', content: 'Cần gạch 30x60 lát nền phòng khách.' },
    { sender: 'CUSTOMER', content: 'Diện tích 50 m2, nhận báo giá qua Zalo trong tuần này.' },
  ], {
    size: '30x60',
    intent: 'LAT_NEN',
    space: 'phong-khach',
  });

  assert.equal(result.size, '30x60');
  assert.equal(result.areaM2, 50);
  assert.equal(result.contactChannel, 'ZALO');
  assert.equal(result.wantsQuote, true);
  assert.equal(result.purchaseTimeline, 'Tuần này');
});

test('scores a detailed request as high potential', () => {
  const requirements = extractRequirementsByRules([
    { sender: 'CUSTOMER', content: 'Cần gạch 30x60 lát nền phòng khách, diện tích 50 m2, báo giá qua Zalo trong tuần này.' },
  ], {
    size: '30x60',
    intent: 'LAT_NEN',
    space: 'phong-khach',
    brand: 'Đồng Tâm',
    color: 'kem',
  });

  const score = calculateLeadScore(requirements, { phone: 'available' });
  assert.equal(getLeadLevel(score), 'HIGH');
});

test('distinguishes lát sàn from lát sân', () => {
  const floor = extractRequirementsByRules([
    { sender: 'CUSTOMER', content: 'Tôi cần gạch lát sàn nhà.' },
  ]);
  const yard = extractRequirementsByRules([
    { sender: 'CUSTOMER', content: 'Tôi cần gạch lát sân trước.' },
  ]);

  assert.equal(floor.intent, 'LAT_NEN');
  assert.equal(yard.intent, 'LAT_NGOAI_TROI');
});
