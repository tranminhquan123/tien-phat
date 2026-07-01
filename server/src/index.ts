// src/index.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';

import authRoutes from '@/routes/authRoutes';
import productRoutes from '@/routes/productRoutes';
import categoryRoutes from '@/routes/categoryRoutes';
import contactRoutes from '@/routes/contactRoutes';
import configRoutes from '@/routes/configRoutes';
import chatRoutes from '@/routes/chatRoutes';
import homeRoutes from '@/routes/homeRoutes';
import employeeRoutes from '@/routes/employeeRoutes';
import { errorHandler } from '@/middlewares/errorHandler';

const app = express();

// Render chuyển tiếp địa chỉ IP thật qua reverse proxy.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// 12 ảnh WEBP được gửi trong JSON dưới dạng data URL nên cần giới hạn lớn hơn 20 MB.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

app.get('/', (_req, res) => {
  res.json({
    service: 'Tien Phat API',
    status: 'online',
    health: '/api/health',
    message: 'Backend API is running. The website frontend is deployed separately.',
  });
});

app.use('/api/home', homeRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin/employees', employeeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/config', configRoutes);
app.use('/api/chat', chatRoutes);

app.get('/api/health', (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '4000');
app.listen(PORT, () => {
  console.log(`🚀 Server Tiến Phát đang chạy tại http://localhost:${PORT}`);
  console.log(`📋 Môi trường: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
