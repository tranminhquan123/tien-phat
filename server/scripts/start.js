'use strict';

const { execFileSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function schemaIsReady() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      to_regclass('public."ChatSession"') IS NOT NULL AS "chatReady",
      to_regclass('public."ContactActivity"') IS NOT NULL AS "crmTableReady",
      EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public'
          AND table_name='ContactMessage'
          AND column_name='followUpAt'
      ) AS "crmColumnReady"
  `);
  const status = rows[0] || {};
  return Boolean(status.chatReady && status.crmTableReady && status.crmColumnReady);
}

function pushSchema() {
  const prismaCli = require.resolve('prisma');
  execFileSync(process.execPath, [prismaCli, 'db', 'push'], {
    stdio: 'inherit',
    env: process.env,
  });
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
  require('../dist/src/index.js');
}

start().catch(async (error) => {
  console.error('Không thể khởi động server:', error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
