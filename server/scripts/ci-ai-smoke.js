'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 4101;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'ci-only-secret-at-least-32-characters-long';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) return;
    } catch {
      // Server đang khởi động.
    }
    await delay(500);
  }
  throw new Error('Server không khởi động kịp');
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${options.method || 'GET'} ${path} -> ${response.status}: ${body.message || 'unknown error'}`);
  }
  return body;
}

async function seed() {
  const category = await prisma.category.upsert({
    where: { slug: 'gach-op-lat' },
    update: { isActive: true },
    create: { name: 'Gạch Ốp Lát', slug: 'gach-op-lat', isActive: true },
  });
  const product = await prisma.product.upsert({
    where: { slug: 'ci-ai-gach-3060' },
    update: {
      categoryId: category.id,
      isActive: true,
      size: '30x60',
      application: 'Lát nền',
      spaces: 'Phòng khách',
    },
    create: {
      name: 'CI AI Gạch 3060 màu kem',
      slug: 'ci-ai-gach-3060',
      categoryId: category.id,
      brand: 'Đồng Tâm',
      size: '30x60',
      color: 'Kem',
      application: 'Lát nền',
      spaces: 'Phòng khách',
      isActive: true,
      isFeatured: true,
    },
  });
  const admin = await prisma.admin.upsert({
    where: { username: 'ci-admin-ai' },
    update: { name: 'CI Admin AI' },
    create: { username: 'ci-admin-ai', name: 'CI Admin AI', password: 'not-used' },
  });
  return { category, product, admin };
}

async function cleanup(ids) {
  if (ids.sessionId) {
    const session = await prisma.chatSession.findUnique({
      where: { id: ids.sessionId },
      select: { handoffContactId: true },
    });
    await prisma.chatSession.deleteMany({ where: { id: ids.sessionId } });
    if (session?.handoffContactId) {
      await prisma.contactMessage.deleteMany({ where: { id: session.handoffContactId } });
    }
  }
  await prisma.admin.deleteMany({ where: { id: ids.adminId } });
  await prisma.product.deleteMany({ where: { id: ids.productId } });
  const remaining = await prisma.product.count({ where: { categoryId: ids.categoryId } });
  if (remaining === 0) await prisma.category.deleteMany({ where: { id: ids.categoryId } });
}

async function main() {
  const seeded = await seed();
  const token = jwt.sign(
    { adminId: seeded.admin.id, username: seeded.admin.username },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
  const adminHeaders = { Authorization: `Bearer ${token}` };
  let sessionId;

  const server = spawn(process.execPath, ['dist/src/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'test',
      CLIENT_URL: 'http://localhost:5173',
      JWT_SECRET,
      OPENAI_API_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (chunk) => process.stdout.write(`[server] ${chunk}`));
  server.stderr.on('data', (chunk) => process.stderr.write(`[server] ${chunk}`));

  try {
    await waitForServer();
    const created = await request('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ sourcePage: 'https://example.com/san-pham' }),
    });
    sessionId = created.data.session.id;
    const accessToken = created.data.accessToken;

    await request(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'X-Chat-Token': accessToken },
      body: JSON.stringify({ message: 'Tôi cần gạch 3060 lát sàn phòng khách Đồng Tâm màu kem' }),
    });
    await request(`/api/chat/sessions/${sessionId}/handoff`, {
      method: 'POST',
      headers: { 'X-Chat-Token': accessToken },
      body: JSON.stringify({ name: 'Khách thử nghiệm', phone: '0900000000' }),
    });
    await request(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'X-Chat-Token': accessToken },
      body: JSON.stringify({ message: 'Công trình tại Thủ Đức, khoảng 50 m2. Gửi báo giá qua Zalo trong tuần này.' }),
    });

    const analyzed = await request(`/api/chat/admin/sessions/${sessionId}/analysis`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ force: true }),
    });
    assert.equal(analyzed.data.provider, 'rules');
    assert.equal(analyzed.data.requirements.size, '30x60');
    assert.equal(analyzed.data.requirements.areaM2, 50);
    assert.equal(analyzed.data.requirements.contactChannel, 'ZALO');
    assert.equal(analyzed.data.requirements.wantsQuote, true);
    assert.ok(analyzed.data.leadScore >= 70);
    assert.ok(analyzed.data.suggestedProducts.some((item) => item.slug === 'ci-ai-gach-3060'));

    const snapshot = await request(`/api/chat/admin/sessions/${sessionId}/analysis`, {
      headers: adminHeaders,
    });
    assert.equal(snapshot.data.analysis.cached, true);
    assert.equal(snapshot.data.analysis.requirements.areaM2, 50);

    const drafted = await request(`/api/chat/admin/sessions/${sessionId}/draft`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        tone: 'FRIENDLY',
        selectedProductIds: [seeded.product.id],
      }),
    });
    assert.equal(drafted.data.provider, 'rules');
    assert.ok(drafted.data.draft.length >= 20);
    assert.ok(drafted.data.draft.includes('CI AI Gạch 3060'));

    const stored = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    assert.ok(stored?.aiSummary);
    assert.ok(stored?.leadScore >= 70);
    assert.ok(stored?.lastAnalyzedAt);
    assert.equal(stored?.aiProvider, 'rules');

    console.log('✅ Smoke test Phase 4: phân tích, chấm điểm, gợi ý sản phẩm và soạn bản nháp thành công.');
  } finally {
    server.kill('SIGTERM');
    await cleanup({
      categoryId: seeded.category.id,
      productId: seeded.product.id,
      adminId: seeded.admin.id,
      sessionId,
    });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Smoke test Phase 4 thất bại:', error);
  process.exitCode = 1;
});
