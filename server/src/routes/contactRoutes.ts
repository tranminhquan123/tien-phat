// src/routes/contactRoutes.ts
import { Router } from 'express';
import {
  submitContact,
  adminListContacts,
  adminUpdateContact,
  adminGetContactStats,
  adminSendTestEmail,
} from '@/controllers/contactController';
import { requireAuth } from '@/middlewares/authMiddleware';
import { contactRateLimit } from '@/middlewares/contactRateLimit';

const router = Router();

router.post('/', contactRateLimit, submitContact);
router.get('/admin', requireAuth, adminListContacts);
router.get('/admin/stats', requireAuth, adminGetContactStats);
router.post('/admin/test-email', requireAuth, adminSendTestEmail);
router.put('/admin/:id', requireAuth, adminUpdateContact);

export default router;
