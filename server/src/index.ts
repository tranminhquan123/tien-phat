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
import { errorHandler } from '@/middlewares/errorHandler';

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Phục vụ file upload
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/config', configRoutes);

// Health check
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (phải đặt cuối cùng)
app.use(errorHandler);

const PORT = parseInt(process.env.PORT || '4000');
app.listen(PORT, () => {
  console.log(`🚀 Server Tiến Phát đang chạy tại http://localhost:${PORT}`);
  console.log(`📋 Môi trường: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
