'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PORT = 4100;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const JWT_SECRET = process.env.JWT_SECRET || 'ci-only-secret-at-least-32-characters-long';

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  let lastError;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw new Error(`Server không khởi động kịp: ${lastError?.message || 'timeout'}`);
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

async function seedCatalogAndAdmin() {
  const category = await prisma.category.upsert({
    where: { slug: 'gach-op-lat' },
    update: { isActive: true },
    create: {
      name: 'Gạch Ốp Lát',
      slug: 'gach-op-lat',
      isActive: true,
      sortOrder: 1,
    },
  });

  const product = await prisma.product.upsert({
    where: { slug: 'ci-gach-3060-lat-nen' },
    update: {
      categoryId: category.id,
      isActive: true,
      size: '30x60',
      application: 'Lát nền',
      spaces: 'Phòng khách',
    },
    create: {
      name: 'CI Gạch 3060 lát nền phòng khách',
      slug: 'ci-gach-3060-lat-nen',
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
    where: { username: 'ci-admin-chat' },
    update: { name: 'CI Admin' },
    create: {
      username: 'ci-admin-chat',
      name: 'CI Admin',
      password: 'not-used-in-smoke-test',
    },
  });

  return { category, product, admin };
}

async function cleanup({ categoryId, productId, sessionId, adminId }) {
  if (sessionId) {
    const session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      select: { handoffContactId: true },
    });

    await prisma.chatSession.deleteMany({ where: { id: sessionId } });
    if (session?.handoffContactId) {
      await prisma.contactMessage.deleteMany({ where: { id: session.handoffContactId } });
    }
  }

  if (adminId) await prisma.admin.deleteMany({ where: { id: adminId } });
  if (productId) await prisma.product.deleteMany({ where: { id: productId } });
  if (categoryId) {
    const remaining = await prisma.product.count({ where: { categoryId } });
    if (remaining === 0) await prisma.category.deleteMany({ where: { id: categoryId } });
  }
}

async function main() {
  const seeded = await seedCatalogAndAdmin();
  const adminToken = jwt.sign(
    { adminId: seeded.admin.id, username: seeded.admin.username },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  let sessionId;

  const server = spawn(process.execPath, ['dist/src/index.js'], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'test',
      CLIENT_URL: 'http://localhost:5173',
      JWT_SECRET,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  server.stdout.on('data', (chunk) => process.stdout.write(`[server] ${chunk}`));
  server.stderr.on('data', (chunk) => process.stderr.write(`[server] ${chunk}`));

  try {
    await waitForServer();

    const health = await request('/api/health');
    assert.equal(health.status, 'ok');

    const created = await request('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ sourcePage: 'https://example.com/san-pham' }),
    });

    sessionId = created.data.session.id;
    const accessToken = created.data.accessToken;
    assert.ok(sessionId);
    assert.ok(accessToken);
    assert.equal(created.data.messages.length, 1);

    const restored = await request(`/api/chat/sessions/${sessionId}`, {
      headers: { 'X-Chat-Token': accessToken },
    });
    assert.equal(restored.data.session.id, sessionId);

    const sizeSelection = await request(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'X-Chat-Token': accessToken },
      body: JSON.stringify({ message: 'Tìm theo kích thước' }),
    });
    const sizeReplies = sizeSelection.data.assistantMessage?.metadata?.quickReplies || [];
    assert.ok(sizeReplies.includes('Kích thước 30 x 60'));

    const answered = await request(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'X-Chat-Token': accessToken },
      body: JSON.stringify({ message: 'Tôi cần gạch 3060 lát sàn phòng khách Đồng Tâm màu kem' }),
    });

    const recommendations = answered.data.assistantMessage?.metadata?.recommendations || [];
    assert.equal(answered.data.session.detectedSize, '30x60');
    assert.equal(answered.data.session.detectedIntent, 'LAT_NEN');
    assert.ok(recommendations.some((item) => item.slug === 'ci-gach-3060-lat-nen'));

    const handoff = await request(`/api/chat/sessions/${sessionId}/handoff`, {
      method: 'POST',
      headers: { 'X-Chat-Token': accessToken },
      body: JSON.stringify({
        name: 'Khách kiểm thử CI',
        phone: '0764432015',
        note: 'Yêu cầu kiểm thử tự động',
      }),
    });
    assert.equal(handoff.data.session.status, 'WAITING_ADMIN');

    const stats = await request('/api/chat/admin/stats', { headers: adminHeaders });
    assert.ok(stats.data.waiting >= 1);
    assert.ok(stats.data.unreadMessages >= 1);

    const inbox = await request('/api/chat/admin/sessions?status=WAITING_ADMIN', {
      headers: adminHeaders,
    });
    const inboxSession = inbox.sessions.find((item) => item.id === sessionId);
    assert.ok(inboxSession);
    assert.ok(inboxSession.unreadCount >= 1);

    const adminDetail = await request(`/api/chat/admin/sessions/${sessionId}`, {
      headers: adminHeaders,
    });
    assert.equal(adminDetail.data.session.id, sessionId);
    assert.ok(adminDetail.data.contact?.message.includes('Nội dung hội thoại'));

    const adminReply = await request(`/api/chat/admin/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ message: 'Chào anh/chị, Tiến Phát đã tiếp nhận yêu cầu và đang kiểm tra mẫu phù hợp.' }),
    });
    assert.equal(adminReply.data.session.status, 'ADMIN_ACTIVE');
    assert.equal(adminReply.data.session.assignedAdminId, seeded.admin.id);
    assert.equal(adminReply.data.message.sender, 'ADMIN');

    const customerSynced = await request(`/api/chat/sessions/${sessionId}`, {
      headers: { 'X-Chat-Token': accessToken },
    });
    assert.ok(customerSynced.data.messages.some((message) => message.sender === 'ADMIN'));

    const customerFollowUp = await request(`/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: { 'X-Chat-Token': accessToken },
      body: JSON.stringify({ message: 'Tôi cần khoảng 50 m2 và muốn nhận báo giá qua Zalo.' }),
    });
    assert.equal(customerFollowUp.data.assistantMessage, null);
    assert.equal(customerFollowUp.data.session.status, 'ADMIN_ACTIVE');

    const refreshedDetail = await request(`/api/chat/admin/sessions/${sessionId}`, {
      headers: adminHeaders,
    });
    assert.ok(refreshedDetail.data.session.messages.some((message) => message.content.includes('50 m2')));

    const closed = await request(`/api/chat/admin/sessions/${sessionId}/status`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'CLOSED' }),
    });
    assert.equal(closed.data.session.status, 'CLOSED');

    const storedSession = await prisma.chatSession.findUnique({ where: { id: sessionId } });
    assert.equal(storedSession?.status, 'CLOSED');
    assert.equal(storedSession?.assignedAdminId, seeded.admin.id);
    assert.ok(storedSession?.handoffContactId);

    const contact = await prisma.contactMessage.findUnique({
      where: { id: storedSession.handoffContactId },
    });
    assert.equal(contact?.status, 'CLOSED');

    console.log('✅ Smoke test Phase 3: admin inbox, tiếp nhận, phản hồi, đồng bộ khách và đóng hội thoại thành công.');
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
  console.error('❌ Smoke test thất bại:', error);
  process.exitCode = 1;
});
