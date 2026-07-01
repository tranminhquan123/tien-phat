'use strict';

const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const port = 4102;
const base = `http://127.0.0.1:${port}`;
const secret = process.env.JWT_SECRET || 'ci-only-secret-at-least-32-characters-long';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status} ${body.message || path}`);
  return body;
}

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      if ((await fetch(`${base}/api/health`)).ok) return;
    } catch {}
    await wait(500);
  }
  throw new Error('CRM smoke server timeout');
}

async function main() {
  const admin = await prisma.admin.upsert({
    where: { username: 'ci-crm-admin' },
    update: { name: 'CI CRM Admin' },
    create: { username: 'ci-crm-admin', name: 'CI CRM Admin', password: 'not-used' },
  });
  const contact = await prisma.contactMessage.create({
    data: {
      name: 'Khách CRM CI',
      phone: '0900000001',
      message: 'Nhu cầu: Gạch lát nền\nKích thước: 60 x 60\nNội dung: Cần báo giá 50 m2',
      source: 'CONTACT_FORM',
    },
  });
  const token = jwt.sign({ adminId: admin.id, username: admin.username }, secret, { expiresIn: '10m' });
  const headers = { Authorization: `Bearer ${token}` };
  const server = spawn(process.execPath, ['dist/src/index.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), JWT_SECRET: secret, NODE_ENV: 'test', CLIENT_URL: 'http://localhost:5173' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => process.stdout.write(`[crm] ${chunk}`));
  server.stderr.on('data', (chunk) => process.stderr.write(`[crm] ${chunk}`));

  try {
    await waitForServer();
    const options = await request('/api/contacts/admin/options', { headers });
    assert.ok(options.data.admins.some((item) => item.id === admin.id));

    const list = await request('/api/contacts/admin?search=0900000001', { headers });
    assert.ok(list.messages.some((item) => item.id === contact.id));

    const followUpAt = new Date(Date.now() + 86400000).toISOString();
    const updated = await request(`/api/contacts/admin/${contact.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        status: 'CONSULTING',
        priority: 'HIGH',
        assignedAdminId: admin.id,
        followUpAt,
        note: 'Đã gọi và hẹn gửi mẫu.',
      }),
    });
    assert.equal(updated.data.status, 'CONSULTING');
    assert.equal(updated.data.priority, 'HIGH');
    assert.equal(updated.data.assignedAdminId, admin.id);

    const detail = await request(`/api/contacts/admin/${contact.id}`, { headers });
    assert.ok(detail.data.contact.activities.length >= 4);
    assert.equal(detail.data.contact.assignedAdmin.name, 'CI CRM Admin');

    const stats = await request('/api/contacts/admin/stats', { headers });
    assert.ok(stats.data.consulting >= 1);
    assert.ok(stats.data.highPriority >= 1);

    console.log('✅ Mini CRM smoke test thành công.');
  } finally {
    server.kill('SIGTERM');
    await prisma.contactMessage.deleteMany({ where: { id: contact.id } });
    await prisma.admin.deleteMany({ where: { id: admin.id } });
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Mini CRM smoke test thất bại:', error);
  process.exitCode = 1;
});
