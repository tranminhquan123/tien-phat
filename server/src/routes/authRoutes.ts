// src/routes/authRoutes.ts
import { Router } from 'express';
import { login, updatePassword } from '@/controllers/authController';
import { requireAuth, requireRole } from '@/middlewares/authMiddleware';
import { adminDisableEmployee } from '@/controllers/employeeMutationController';
import employeeRoutes from '@/routes/employeeRoutes';

const router = Router();

router.post('/login', login);
router.put('/change-password', requireAuth, updatePassword);
router.post('/employees/:id/archive', requireAuth, requireRole('OWNER', 'MANAGER'), adminDisableEmployee);
router.post('/team/:id/archive', requireAuth, requireRole('OWNER', 'MANAGER'), adminDisableEmployee);
router.put('/team/:id/status', requireAuth, requireRole('OWNER', 'MANAGER'), adminDisableEmployee);
router.use('/employees', employeeRoutes);
router.use('/team', employeeRoutes);

export default router;
