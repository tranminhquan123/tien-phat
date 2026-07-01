// src/routes/authRoutes.ts
import { Router } from 'express';
import { login, updatePassword } from '@/controllers/authController';
import { requireAuth } from '@/middlewares/authMiddleware';
import employeeRoutes from '@/routes/employeeRoutes';

const router = Router();

router.post('/login', login);
router.put('/change-password', requireAuth, updatePassword);
router.use('/employees', employeeRoutes);

export default router;
