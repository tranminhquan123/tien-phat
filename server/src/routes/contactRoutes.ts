// src/routes/contactRoutes.ts
import { Router } from 'express';
import { submitContact, adminListContacts, adminUpdateContact, adminGetContactStats } from '@/controllers/contactController';
import { requireAuth } from '@/middlewares/authMiddleware';

const router = Router();

router.post('/', submitContact);
router.get('/admin', requireAuth, adminListContacts);
router.get('/admin/stats', requireAuth, adminGetContactStats);
router.put('/admin/:id', requireAuth, adminUpdateContact);

export default router;
