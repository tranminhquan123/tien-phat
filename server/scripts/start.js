'use strict';

const { execFileSync } = require('node:child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function schemaIsReady() {
  const rows = await prisma.$queryRawUnsafe(`
    SELECT
      EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ChatSession'
      ) AS "chatSession",
      EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'ChatMessage'
      ) AS "chatMessage",
      EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'ChatSession'
          AND column_name = 'detectedColor'
      ) AS "detectedColor"
  `);

  const status = rows[0] || {};
  return Boolean(status.chatSession && status.chatMessage && status.detectedColor);
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

  if (process.env.FORCE_DB_PUSH === 'true') {
    console.log('FORCE_DB_PUSH=true, đang đồng bộ Prisma schema...');
  } else {
    try {
      ready = await schemaIsReady();
    } catch (error) {
      console.warn('Không thể kiểm tra phiên bản schema, sẽ chạy prisma db push:', error.message);
    }
  }

  await prisma.$disconnect();

  if (!ready) {
    pushSchema();
  } else {
    console.log('Prisma schema đã sẵn sàng, bỏ qua db push để khởi động nhanh hơn.');
  }

  require('../dist/src/index.js');
}

start().catch(async (error) => {
  console.error('Không thể khởi động server:', error);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
