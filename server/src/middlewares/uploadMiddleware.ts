// src/middlewares/uploadMiddleware.ts
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';

const uploadDir = path.resolve(process.cwd(), 'uploads', 'products');
fs.mkdirSync(uploadDir, { recursive: true });

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const extensionByMimeType: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, uploadDir),
  filename: (_req, file, callback) => {
    const extension = extensionByMimeType[file.mimetype] ?? '.jpg';
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

export const productImageUpload = multer({
  storage,
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 8,
  },
  fileFilter: (_req, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error('Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF'));
      return;
    }
    callback(null, true);
  },
});
