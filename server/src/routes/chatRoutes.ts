import { Router } from 'express';
import {
  createSession,
  getSession,
  handoffSession,
  postMessage,
} from '@/controllers/chatController';
import {
  adminChangeChatStatus,
  adminGetChatSession,
  adminGetChatStats,
  adminListChatSessions,
  adminPostChatMessage,
} from '@/controllers/adminChatController';
import { chatRateLimit } from '@/middlewares/chatRateLimit';
import { requireAuth } from '@/middlewares/authMiddleware';

const router = Router();

// Admin routes đặt trước :id để tránh xung đột với session công khai.
router.get('/admin/stats', requireAuth, adminGetChatStats);
router.get('/admin/sessions', requireAuth, adminListChatSessions);
router.get('/admin/sessions/:id', requireAuth, adminGetChatSession);
router.post('/admin/sessions/:id/messages', requireAuth, adminPostChatMessage);
router.put('/admin/sessions/:id/status', requireAuth, adminChangeChatStatus);

router.use(chatRateLimit);
router.post('/sessions', createSession);
router.get('/sessions/:id', getSession);
router.post('/sessions/:id/messages', postMessage);
router.post('/sessions/:id/handoff', handoffSession);

export default router;
