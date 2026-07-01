import { Router } from 'express';
import { submitContact, adminSendTestEmail } from '@/controllers/contactController';
import {
  crmGetContact,
  crmGetOptions,
  crmGetStats,
  crmListContacts,
  crmUpdateContact,
} from '@/controllers/crmController';
import { requireAuth } from '@/middlewares/authMiddleware';
import { contactRateLimit } from '@/middlewares/contactRateLimit';

const router = Router();

router.post('/', contactRateLimit, submitContact);
router.get('/admin/stats', requireAuth, crmGetStats);
router.get('/admin/options', requireAuth, crmGetOptions);
router.post('/admin/test-email', requireAuth, adminSendTestEmail);
router.get('/admin', requireAuth, crmListContacts);
router.get('/admin/:id', requireAuth, crmGetContact);
router.put('/admin/:id', requireAuth, crmUpdateContact);

export default router;
