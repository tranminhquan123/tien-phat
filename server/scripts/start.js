'use strict';

const { execFileSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function schemaIsReady() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      to_regclass('public."ChatSession"') IS NOT NULL AS "chatReady",
      to_regclass('public."ContactActivity"') IS NOT NULL AS "crmReady",
      to_regclass('public."AdminAuditLog"') IS NOT NULL AS "employeeAuditReady",
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name='ContactMessage'
          AND column_name='followUpAt'
      ) AS "crmColumnReady",
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name='Admin'
          AND column_name='role'
      ) AS "employeeRoleReady"
  `);
  const status = rows[0] || {};
  return Boolean(
    status.chatReady
    && status.crmReady
    && status.crmColumnReady
    && status.employeeAuditReady
    && status.employeeRoleReady
  );
}

function pushSchema() {
  const prismaCli = require.resolve('prisma');
  // Prisma yêu cầu cờ này khi thêm unique index vào bảng đã có dữ liệu.
  // Cờ chỉ chấp nhận cảnh báo để tiếp tục; PostgreSQL vẫn từ chối nếu dữ liệu
  // thực tế vi phạm unique constraint, vì vậy không âm thầm xóa bản ghi.
  execFileSync(process.execPath, [prismaCli, 'db', 'push', '--accept-data-loss'], {
    stdio: 'inherit',
    env: process.env,
  });
}

async function ensureOwnerExists() {
  const client = new PrismaClient();
  try {
    await client.$executeRawUnsafe(`
      UPDATE "Admin"
      SET "role" = 'OWNER'
      WHERE "id" = (
        SELECT "id"
        FROM "Admin"
        WHERE "deletedAt" IS NULL
        ORDER BY "createdAt" ASC
        LIMIT 1
      )
      AND NOT EXISTS (
        SELECT 1
        FROM "Admin"
        WHERE "role" = 'OWNER'
          AND "isActive" = true
          AND "deletedAt" IS NULL
      )
    `);
  } finally {
    await client.$disconnect();
  }
}

async function start() {
  let ready = false;
  if (process.env.FORCE_DB_PUSH !== 'true') {
    try {
      ready = await schemaIsReady();
    } catch (error) {
      console.warn('Không thể kiểm tra schema, sẽ đồng bộ lại:', error.message);
    }
  }
  await prisma.$disconnect();
  if (!ready) pushSchema();
  else console.log('Prisma schema đã sẵn sàng.');
  await ensureOwnerExists();
  require('../dist/src/index.js');
}

start().catch(async (error) => {
  console.error('Không thể khởi động server:', error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
